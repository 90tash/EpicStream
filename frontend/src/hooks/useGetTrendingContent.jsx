import { useEffect, useState } from "react";
import { useContentStore } from "../stores/content";
import { tmdbFetch } from "../utils/tmdb";

const useGetTrendingContent = () => {
  const [trendingContent, setTrendingContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contentType } = useContentStore();

  useEffect(() => {
    const getTrendingContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await tmdbFetch(`/trending/${contentType}/day`);
        setTrendingContent(data.results || []);
      } catch (err) {
        setError(err);
        console.error("Error fetching trending content:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getTrendingContent();
  }, [contentType]);

  return { trendingContent, isLoading, error };
};

export default useGetTrendingContent;
