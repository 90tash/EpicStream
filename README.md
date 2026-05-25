# EpicStream

EpicStream is a frontend movie and TV discovery app built with React, Vite, CSS, and TMDB data. It uses a dark cinematic interface with wide content rows, immersive hero artwork, search overlays, detail pages, trailers, cast information, and curated browsing sections.

## Features

- Immersive auto-rotating hero section with TMDB backdrop imagery.
- Wide horizontal movie and TV rows with ratings, years, media types, and Top 10 badges.
- Cinematic search overlay with category filtering, expandable result previews, and detail navigation.
- Movie, TV, and people detail pages with trailers, cast, metadata, and similar titles.
- EpicStream branding with a custom red streaming-style wordmark.
- Frontend-only demo architecture with direct TMDB API usage.

## Tech Stack

- React 18
- Vite
- JavaScript
- Vanilla CSS
- React Router DOM
- Zustand
- Lucide React
- React Player
- TMDB API

## Run Locally

Install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Environment

The app uses a Vercel serverless API route to keep the TMDB key out of the browser bundle. For local development, create `frontend/.env.local`:

```text
TMDB_API_KEY=your_tmdb_key_here
```

For Vercel, add the same environment variable in Project Settings:

```text
TMDB_API_KEY=your_tmdb_key_here
```

Do not use a `VITE_` prefix for this key. `VITE_` variables are exposed to browser code.

## Deploy To Vercel

Import the repository in Vercel and use:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

The frontend calls `/api/tmdb`, and the serverless function forwards requests to TMDB with the server-side key.

## Project Structure

```text
epicstream/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── utils/
│   ├── index.html
│   └── package.json
├── README.md
└── package.json
```

## Developer Links

- LinkedIn: [Ashish Kumar Patra](https://linkedin.com/in/ashish-kumar-patra-2b4207315/)
- GitHub: [90tash](https://github.com/90tash)

## Note

This application is a frontend-focused project. Media metadata is dynamically sourced from the TMDB API, and playback buttons link to external player/detail experiences.
