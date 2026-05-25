import { useEffect, useState } from "react";
import { tmdbFetch } from "../utils/tmdb";

const TrendingMovies = () => {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = await tmdbFetch("/trending/movie/day");
        if (data.results) {
          setMovies(data.results);
        } else {
          setError(data.status_message || "Unable to load movies");
        }
      } catch (err) {
        setError("Failed to fetch movies");
        console.error(err);
      }
    };

    fetchMovies();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Trending Movies</h1>
      {movies.length > 0 ? (
        <ul>
          {movies.map((movie) => (
            <li key={movie.id}>{movie.title}</li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TrendingMovies;
