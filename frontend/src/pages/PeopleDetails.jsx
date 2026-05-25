import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
        setCredits(creditsData.cast.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 20));
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

  if (isLoading) return <div className="people-details-page"><Navbar /><p style={{textAlign:'center', padding:'100px'}}>Loading...</p></div>;
  if (!details) return null;

  return (
    <div className="people-details-page">
      <Navbar />
      
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
                  <img
                    src={imageUrl(credit.poster_path, "w342")}
                    alt={getTitle(credit)}
                  />
                  <p>{getTitle(credit)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PeopleDetails;
