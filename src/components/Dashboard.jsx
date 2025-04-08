import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext";
import Header from "./Header";
import NavBar from "./NavBar"; 
import "../styles.css";

// Images
import profilePlaceholder from "../assets/profile-placeholder.png";
import progressChart from "../assets/progress.png";

const DashboardPage = () => {
  const { username, setUsername, logoutUser } = useContext(UserContext);
  const { userStats, dailyStats } = useContext(UserStatisticsContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedGame, setSelectedGame] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.redirected) {
      setMessage("⚠️ You must be logged in to access that page.");
    }
  }, [location]);

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem("currentUser");
    setUsername("");
    navigate("/");
  };

  const handleGameSelection = () => {
    if (!selectedGame) {
      setMessage("❌ Please select a game to play from the list above!");
    } else {
      setMessage("");
      navigate(`/game/${selectedGame}`);
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <NavBar />

      <div className="betaMessage">
        <p><strong>Thank you for joining our Beta Test...<br />
        <a href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"
           target="_blank" rel="noopener noreferrer">
           Find the Survey Here</a></strong></p>
        <p><strong>THIS OPEN BETA WILL CLOSE ON FRIDAY, APRIL 4!</strong></p>
      </div>

      <div className="dashboard-container">

        {/* ✅ Profile Section */}
        <div className="panel profile">
          <h3 className="dboardH2">Welcome {username || "Your Profile"}!</h3>
          {userStats && dailyStats ? (
            <div className="dashboard-stats">
              <p><strong>Total Games Played:</strong> {userStats.total?.total_questions ?? 0}</p>
              <p><strong>Streak:</strong> {dailyStats.current_streak ?? 0} days 🔥</p>
              {/* <p><strong>Rank:</strong> {userStats.rank || "Unranked"}</p> */}
            </div>
          ) : (
            <p style={{ color: "white" }}>Loading stats...</p>
          )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {/* ✅ Game Selection */}
        <div className="panel game-selection">
          <h2 className="dboardH2">Select a Game to Play</h2>
          {[
            { label: "🧮 Math", value: "math" },
            { label: "❓ Trivia", value: "trivia" },
            { label: "⚡ Reaction", value: "reaction" },
            { label: "🧠 Memory", value: "memory" },
            { label: "🔢 Sudoku", value: "sudoku" },
          ].map(({ label, value }) => (
            <label className="gameSelect" key={value}>
              <input
                type="radio"
                name="game"
                value={value}
                onChange={(e) => setSelectedGame(e.target.value)}
              />{" "}
              {label}
            </label>
          ))}
          <br />
          <button className="nav-btn-select" onClick={handleGameSelection}>
            Play Now!
          </button>
          {message && <p style={{ color: "red" }}>{message}</p>}
        </div>

        {/* ✅ Progress Overview */}
        <div className="panel progress">
          <h2 className="dboardH2">📊 Progress Overview</h2>
          <p style={{ color: "red" }}>Placeholder Content</p>
          <img
            src={progressChart}
            alt="User Progress Chart"
            className="stats-image"
          />
          <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

