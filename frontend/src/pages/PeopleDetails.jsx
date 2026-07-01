import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import "./peopleDetails.css";
import { getTitle, imageUrl, tmdbFetch } from "../utils/tmdb";

const PeopleDetails = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [details, setDetails] = useState(state?.person || null);
  const [allCredits, setAllCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(!state?.person);
  const [showFullBiography, setShowFullBiography] = useState(false);
  const [mediaType, setMediaType] = useState("movie");

  useEffect(() => {
    if (details?.name) {
      document.title = `${details.name} - EpicStream`;
    } else {
      document.title = "EpicStream";
    }
    return () => {
      document.title = "EpicStream";
    };
  }, [details]);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchAllData = async () => {
      const personId = details?.id || id;
      if (!personId) return;

      try {
        setIsLoading(true);
        const [detailsData, creditsData] = await Promise.all([
          tmdbFetch(`/person/${personId}`),
          tmdbFetch(`/person/${personId}/combined_credits`)
        ]);

        setDetails(detailsData);
        
        // Combine cast and crew, tagging them for identification
        const allCredits = [
          ...(creditsData.cast || []).map(c => ({ ...c, credit_type: "cast" })),
          ...(creditsData.crew || []).map(c => ({ ...c, credit_type: "crew" }))
        ];

        // Deduplicate: Keep one entry per movie/tv show, prioritizing the primary role
        const uniqueMap = new Map();
        allCredits.forEach(item => {
          const key = `${item.id}-${item.media_type}`;
          const isPrimary = detailsData.known_for_department === "Acting" 
            ? item.credit_type === "cast" 
            : item.department === detailsData.known_for_department;

          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          } else {
            const existing = uniqueMap.get(key);
            const wasExistingPrimary = detailsData.known_for_department === "Acting" 
              ? existing.credit_type === "cast" 
              : existing.department === detailsData.known_for_department;

            if (isPrimary && !wasExistingPrimary) {
              uniqueMap.set(key, item);
            } else if (isPrimary === wasExistingPrimary) {
              if ((item.vote_count || 0) > (existing.vote_count || 0)) {
                uniqueMap.set(key, item);
              }
            }
          }
        });

        // Sort: Primary roles first, then by popularity (vote_count)
        const sortedCredits = Array.from(uniqueMap.values()).sort((a, b) => {
          const aPrimary = detailsData.known_for_department === "Acting" 
            ? a.credit_type === "cast" 
            : a.department === detailsData.known_for_department;
          const bPrimary = detailsData.known_for_department === "Acting" 
            ? b.credit_type === "cast" 
            : b.department === detailsData.known_for_department;

          if (aPrimary && !bPrimary) return -1;
          if (!aPrimary && bPrimary) return 1;
          return (b.vote_count || 0) - (a.vote_count || 0);
        });

        setAllCredits(sortedCredits);
      } catch (error) {
        console.error("Error fetching person details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [id, details?.id]);

  const handleCreditClick = (movie) => {
    const type = movie.media_type || (movie.first_air_date ? "tv" : "movie");
    navigate(`/${type}/${movie.id}`, { state: { movie } });
  };

  const renderMetadata = (isMobile) => {
    const parts = [];
    if (details.known_for_department) {
      parts.push(details.known_for_department);
    }
    if (details.birthday) {
      const birthYear = new Date(details.birthday).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      parts.push(`${birthYear} (${age} years old)`);
    }
    if (details.place_of_birth) {
      parts.push(details.place_of_birth);
    }
    
    if (parts.length === 0) return null;

    return (
      <div className={`people-metadata ${isMobile ? 'mobile' : 'desktop'}`}>
        {parts.map((part, index) => (
          <span key={index} className="metadata-item">
            {part}
            {index < parts.length - 1 && <span className="bullet"> • </span>}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="people-details-page"><p style={{textAlign:'center', padding:'100px'}}>Loading...</p></div>;
  if (!details) return null;

  return (
    <div className="people-details-page">
      <button className="back-btn-simple" onClick={() => navigate("/")} aria-label="Go back">
          <ChevronLeft size={24} />
      </button>
      
      <main className="people-container">
        <div className="people-top-section">
          <aside className="people-sidebar">
            <img
              src={imageUrl(details.profile_path, "h632", "/avatar1.png")}
              alt={details.name}
            />
            <h1 className="people-name-mobile">{details.name}</h1>
            {renderMetadata(true)}
          </aside>

          <section className="people-main">
            <h1 className="people-name-desktop">{details.name}</h1>
            {renderMetadata(false)}
            
            <div className="biography">
              {details.biography ? (
                <div className="biography-container">
                  <p className="people-biography-text">
                    {showFullBiography || details.biography.length <= 400
                      ? details.biography
                      : `${details.biography.slice(0, 400)}...`}
                  </p>
                  {details.biography.length > 400 && (
                    <button 
                      type="button"
                      className="read-more-btn"
                      onClick={() => setShowFullBiography(!showFullBiography)}
                    >
                      {showFullBiography ? "Read Less" : "Read More"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="people-biography-text">We don't have a biography for {details.name}.</p>
              )}
            </div>
          </section>
        </div>

        <section className="known-for">
          <div className="filmography-header">
            <h2>Filmography</h2>
            <div className="media-toggle-container">
              <div className={`media-toggle-slider ${mediaType}`} />
              <button 
                type="button"
                className={`media-toggle-btn ${mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => setMediaType('movie')}
              >
                Movies
              </button>
              <button 
                type="button"
                className={`media-toggle-btn ${mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => setMediaType('tv')}
              >
                TV Shows
              </button>
            </div>
          </div>
          <div className="credits-grid">
            {allCredits
              .filter((c) => c.media_type === mediaType)
              .slice(0, 20)
              .map((credit) => (
                <div
                  key={credit.id + credit.media_type}
                  className="credit-item"
                  onClick={() => handleCreditClick(credit)}
                >
                  <div className="card-img-wrapper">
                    <img
                      src={imageUrl(credit.poster_path, "w342")}
                      alt={getTitle(credit)}
                    />
                  </div>
                  <p className="credit-title">{getTitle(credit)}</p>
                  <div className="credit-meta">
                    {credit.vote_average > 0 && (
                      <span className="rating">
                        <Star size={11} fill="currentColor" />
                        {credit.vote_average.toFixed(1)}
                      </span>
                    )}
                    {(credit.release_date || credit.first_air_date) && (
                      <span>
                        {credit.vote_average > 0 && <span className="bullet"> • </span>}
                        {(credit.release_date || credit.first_air_date || "").slice(0, 4)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PeopleDetails;
