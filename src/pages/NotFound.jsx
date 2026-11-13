import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search } from "lucide-react";
import "../styles/NotFound.css";

function NotFound() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <main className="not-found-page">
      <div className="not-found-top">
        <h1>404</h1>
        <h3>Page Not Found</h3>
      </div>

      <div className="ghost-container">
        <div className="ghost-copy">
          <div className="ghost-wave one"></div>
          <div className="ghost-wave two"></div>
          <div className="ghost-wave three"></div>
          <div className="ghost-wave four"></div>
        </div>

        <div className="ghost">
          <div className="ghost-face">
            <div className="ghost-eye"></div>
            <div className="ghost-eye-right"></div>
            <div className="ghost-mouth"></div>
          </div>
        </div>

        <div className="ghost-shadow"></div>
      </div>

      <div className="not-found-bottom">
        <p className="not-found-message">
          Boo! Looks like a ghost stole this page!
        </p>

        <form className="ghost-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search images"
          />

          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        <div className="not-found-buttons">
          <button
            className="not-found-btn"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>

          <button
            className="not-found-btn home-btn"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>

      <footer className="not-found-footer">
        Picture-To-Picture
      </footer>
    </main>
  );
}

export default NotFound;