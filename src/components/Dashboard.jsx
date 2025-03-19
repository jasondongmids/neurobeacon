import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  // State to track selected game
  const [selectedGame, setSelectedGame] = useState("");
  // State to store a message for the user.
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("Location:", location);
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
      // Proceed with game selection logic. For example, navigate to the game page.
      navigate(`/game/${selectedGame}`);
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <NavBar />
      <div style={{background-color:"white" }}><p style={{ color: "red" }}><strong>Thank you for joining our Beta Test. Current functionality is not final.<br />Please do not use phones for testing. All feedback welcome!</strong></p></div>
      <div className="dashboard-container">
        {/* ✅ Profile Section */}
        <div className="panel profile">
          <h2 className="dboardH2"> Welcome {username || "Your Profile"}!</h2>
          <p style={{ color: "red" }}>Placeholder Content</p>
          <p><strong>You've Played 120 games</strong></p>
          <p><strong>Your Current Streak is 14 Days🔥 </strong></p>
          <p><strong>Congratulations!<br />You Hold the Rank of Brain Trainer Level 3🏅</strong></p>
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

