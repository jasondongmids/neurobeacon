import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext";
import Header from "./Header";
import NavBar from "./NavBar";
import "../styles.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
      navigate(`/game/${selectedGame}`);
    }
  };

  const totalGames = userStats?.total?.total_questions ?? 0;
  const streak = dailyStats?.current_streak ?? 0;

  return (
    <div className="dashboard-page">
      <Header />
      <NavBar />

     {/* <div className="betaMessage">
        <p>
          <strong>
            Thank you for joining our Beta Test. Current functionality is not final.
            <br />
            Mobile development is still ongoing and there may be some bugs. All feedback welcome!
            <br />
            When you are done playing, please fill out our user survey to help us make NeuroBeacon even better!
            <br />
            <a
              href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
            >
              Find the Survey Here
            </a>
          </strong>
        </p>
        <p><strong>THIS OPEN BETA WILL CLOSE ON FRIDAY, APRIL 4!</strong></p>
      </div>*/}

      <div className="dashboard-container">

        {/* ✅ Profile Panel */}
        <div className="panel profile">
          <h2 className="dboardH2">Welcome!</h2>
          <h3>Glad to have you back, {username || "Your Profile"}. Check out your personal stats below</h3>
          <div className="dashboard-stats">
            <p><strong>Total Games Played:</strong> {totalGames}</p>
            <p><strong>Streak:</strong> {streak} days 🔥</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {/* ✅ Game Selection Panel */}
        <div className="panel game-selection">
          <h2 className="dboardH2">Select a Game to Play</h2>
          {["math", "trivia", "reaction", "memory", "sudoku"].map((game) => (
            <label className="gameSelect" key={game}>
              <input
                type="radio"
                name="game"
                value={game}
                onChange={(e) => setSelectedGame(e.target.value)}
              />{" "}
              {game === "math" ? "🧮 Math" :
                game === "trivia" ? "❓ Trivia" :
                game === "reaction" ? "⚡ Reaction" :
                game === "memory" ? "🧠 Memory" :
                "🔢 Sudoku"}
            </label>
          ))}
          <br />
          <button className="nav-btn-select" onClick={handleGameSelection}>Play Now!</button>
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
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "#fff" }}>Test Chart (Static Data)</h3>

          </div>

          <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;



