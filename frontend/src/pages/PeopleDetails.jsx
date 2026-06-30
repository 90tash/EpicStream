import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import "./peopleDetails.css";
import { getTitle, imageUrl, tmdbFetch } from "../utils/tmdb";

const PeopleDetails = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [details, setDetails] = useState(state?.person || null);
  const [credits, setCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(!state?.person);

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

        setCredits(sortedCredits.slice(0, 20));
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

  if (isLoading) return <div className="people-details-page"><p style={{textAlign:'center', padding:'100px'}}>Loading...</p></div>;
  if (!details) return null;

  return (
    <div className="people-details-page">
      <button className="back-btn-simple" onClick={() => navigate("/")} aria-label="Go back">
          <ChevronLeft size={24} />
      </button>
      
      <main className="people-container">
        <aside className="people-sidebar">
          <img
            src={imageUrl(details.profile_path, "h632", "/avatar1.png")}
            alt={details.name}
          />
          <h2>Personal Info</h2>
          <div className="info-item">
            <label>Known For</label>
            <p>{details.known_for_department}</p>
          </div>
          <div className="info-item">
            <label>Gender</label>
            <p>{details.gender === 1 ? "Female" : details.gender === 2 ? "Male" : "Not specified"}</p>
          </div>
          {details.birthday && (
            <div className="info-item">
              <label>Birthday</label>
              <p>{details.birthday} ({new Date().getFullYear() - new Date(details.birthday).getFullYear()} years old)</p>
            </div>
          )}
          <div className="info-item">
            <label>Place of Birth</label>
            <p>{details.place_of_birth || "N/A"}</p>
          </div>
        </aside>

        <section className="people-main">
          <h1>{details.name}</h1>
          
          <div className="biography">
            <h2>Biography</h2>
            <p>{details.biography || `We don't have a biography for ${details.name}.`}</p>
          </div>

          <div className="known-for">
            <h2>Known For</h2>
            <div className="credits-grid">
              {credits.map((credit) => (
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
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PeopleDetails;
