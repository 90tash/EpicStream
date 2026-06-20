/* global process */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { handleTmdbRequest } from './api/tmdbProxy.js'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

const tmdbDevMiddleware = (apiKey) => ({
  name: 'tmdb-dev-middleware',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url || '', 'http://localhost');

      if (requestUrl.pathname !== '/api/tmdb') {
        next();
        return;
      }

      try {
        const result = await handleTmdbRequest(requestUrl, apiKey);
        response.statusCode = result.status;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(result.body));
      } catch (error) {
        console.error('TMDB dev proxy request failed:', error);
        response.statusCode = 502;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ message: 'Unable to reach TMDB.' }));
      }
    });
  },
})

const anilistDevMiddleware = () => ({
  name: 'anilist-dev-middleware',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url || '', 'http://localhost');

      if (requestUrl.pathname !== '/api/anilist') {
        next();
        return;
      }

      if (request.method !== 'POST') {
        response.statusCode = 405;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ message: 'Method Not Allowed. Use POST.' }));
        return;
      }

      let body = '';
      request.on('data', (chunk) => {
        body += chunk;
      });

      request.on('end', async () => {
        try {
          const { query, variables } = JSON.parse(body || '{}');
          if (!query) {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ message: 'GraphQL query is required.' }));
            return;
          }

          const anilistResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
          });

          const result = await anilistResponse.json();
          response.statusCode = anilistResponse.status;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify(result));
        } catch (error) {
          console.error('AniList dev proxy request failed:', error);
          response.statusCode = 502;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ message: 'Unable to reach AniList.' }));
        }
      });
    });
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tmdbDevMiddleware(env.TMDB_API_KEY), anilistDevMiddleware()],
  };
})
