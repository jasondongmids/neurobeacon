import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserStatisticsContext from "../context/UserStatisticsContext";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; 
import "../styles.css";

// ✅ Import images directly (Replacing require())
import profilePlaceholder from "../assets/profile-placeholder.png";
import progressChart from "../assets/progress.png";

const DashboardPage = () => {
  const { username, setUsername, logoutUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { userStats } = useContext(UserStatisticsContext);
  const overallStats = userStats;
  
  // State to track selected game
  const [selectedGame, setSelectedGame] = useState("");
  // State to store a message for the user.
  const [message, setMessage] = useState("");



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
      // Proceed with game selection logic. For example, navigate to the game page.
      navigate(`/game/${selectedGame}`);
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <NavBar />
      <div className="betaMessage"><p><strong>Thank you for joining our Beta Test. Current functionality is not final.<br />Mobile development is still ongoing and there may be some bugs. All feedback welcome!<br />When you are done playing, please fill out our user survey to help us make NeuroBeacon even better!<br /><a href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"target="_blank"
        rel="noopener noreferrer">Find the Survey Here</a></strong></p>
      <p><strong>THIS OPEN BETA WILL CLOSE ON FRIDAY, APRIL 4!</strong></p></div>
      <div className="dashboard-container">
        {/* ✅ Profile Section  */}
        <div className="panel profile">
          <h3 className="dboardH2"> Welcome {username || "Your Profile"}!</h3>
          {overallStats ? (
        <div className="dashboard-stats">
          <p><strong>Total Games Played:</strong> {userStats.total?.total_questions ?? 0}</p>
          <p><strong>Streak:</strong> {userStats.current_streak ?? 0} days 🔥</p>
           {/* <p><strong>Rank:</strong> {overallStats.rank || "Unranked"}</p>  */}
        </div>
      ) : (
        <p style={{ color: "white" }}>Loading stats...</p>
      )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {/* ✅ Game Selection Panel */}
        <div className="panel game-selection">
          <h2 className="dboardH2">Select a Game to Play</h2>

          {/* ✅ Use state to track selection */}
          <label className="gameSelect">
            <input
              type="radio"
              name="game"
              value="math"
              onChange={(e) => setSelectedGame(e.target.value)}
            />{" "}
            🧮 Math
          </label>
          <label className="gameSelect">
            <input
              type="radio"
              name="game"
              value="trivia"
              onChange={(e) => setSelectedGame(e.target.value)}
            />{" "}
            ❓ Trivia
          </label>
          <label className="gameSelect">
            <input
              type="radio"
              name="game"
              value="reaction"
              onChange={(e) => setSelectedGame(e.target.value)}
            />{" "}
            ⚡ Reaction
          </label>
          <label className="gameSelect">
            <input
              type="radio"
              name="game"
              value="memory"
              onChange={(e) => setSelectedGame(e.target.value)}
            />{" "}
            🧠 Memory
          </label>
          <label className="gameSelect">
            <input
              type="radio"
              name="game"
              value="sudoku"
              onChange={(e) => setSelectedGame(e.target.value)}
            />{" "}
            🔢 Sudoku
          </label>
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
