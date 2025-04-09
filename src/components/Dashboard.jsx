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



const DashboardPage = () => {
  const { username, setUsername, logoutUser } = useContext(UserContext);
  const { userStats, dailyStats, queryStats } = useContext(UserStatisticsContext); // ✅ only here
  const navigate = useNavigate();
  const location = useLocation();

  const [dailyHistory, setDailyHistory] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.redirected) {
      setMessage("⚠️ You must be logged in to access that page.");
    }

    const fetchData = async () => {
      const result = await queryStats("daily", 5);
      if (Array.isArray(result)) {
        setDailyHistory(result);
      }
    };

    fetchData();
  }, [location, queryStats]); // ✅ safe to leave this here

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
          <h2 className="dboardH2">Welcome</h2>
          <h3>{username || "Your Profile"}!</h3>
          {userStats && dailyStats ? (
            <div className="dashboard-stats">
              <p><strong>Total Games Played:</strong> {userStats.total?.total_questions ?? 0}</p>
              <p><strong>Streak:</strong> {dailyStats.current_streak ?? 0} days 🔥</p>
              {/* <p><strong>Rank:</strong> {userStats.rank || "Unranked"}</p> */}
            </div>
          ) : (
            <p style={{ color: "#2e86c1;" }}>Loading stats...</p>
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
        
          {!dailyHistory.length ? (
            <p style={{ color: "white" }}>Loading recent performance data...</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={dailyHistory.map((entry) => ({
                    date: String(entry.sk).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
                    accuracy: (entry.total?.percent_correct ?? 0) * 100,
                  }))}

                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#82ca9d"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ marginTop: "12px" }}>
                You're improving! Keep pushing forward to increase your streak! 🚀
              </p>
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default DashboardPage;

