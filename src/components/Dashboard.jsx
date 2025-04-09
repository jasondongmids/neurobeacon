import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import NavBar from "./NavBar";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import "../styles.css";

const DashboardPage = () => {
  const { username = "User", logoutUser, setUsername } = useContext(UserContext) || {};
  const { userStats, dailyStats, queryStats } = useContext(UserStatisticsContext) || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [dailyHistory, setDailyHistory] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Defensive log
  useEffect(() => {
    console.log("✅ Dashboard mounted");
  }, []);

  useEffect(() => {
    if (location?.state?.redirected) {
      setMessage("⚠️ You must be logged in to access that page.");
    }

    if (!queryStats) {
      console.warn("queryStats function is undefined!");
      return;
    }

    const fetchDaily = async () => {
      try {
        const result = await queryStats("daily", 5);
        if (Array.isArray(result)) {
          setDailyHistory(result);
          console.log("✅ Fetched daily stats:", result);
        } else {
          console.warn("Unexpected daily stats format:", result);
        }
      } catch (error) {
        console.error("❌ Failed to fetch daily stats:", error);
      }
    };

    fetchDaily();
  }, [location, queryStats]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("currentUser");
      setUsername("");
      navigate("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleGameSelection = () => {
    if (!selectedGame) {
      setMessage("❌ Please select a game to play from the list above!");
    } else {
      navigate(`/game/${selectedGame}`);
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <NavBar />

      <div className="dashboard-container">
        <div className="panel profile">
          <h2>Welcome, {username}!</h2>
          {userStats ? (
            <>
              <p><strong>Total Games Played:</strong> {userStats.total?.total_questions ?? 0}</p>
              <p><strong>Streak:</strong> {dailyStats?.current_streak ?? 0} days 🔥</p>
            </>
          ) : (
            <p>Loading stats...</p>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>

        <div className="panel game-selection">
          <h3>Select a Game</h3>
          {["math", "trivia", "reaction", "memory", "sudoku"].map((game) => (
            <label key={game}>
              <input
                type="radio"
                name="game"
                value={game}
                onChange={(e) => setSelectedGame(e.target.value)}
              />
              {game.toUpperCase()}
            </label>
          ))}
          <br />
          <button onClick={handleGameSelection}>Play Now</button>
          {message && <p style={{ color: "red" }}>{message}</p>}
        </div>

        <div className="panel progress">
          <h3>📈 Daily Accuracy</h3>
          {!dailyHistory.length ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={dailyHistory.map((entry) => ({
                  date: String(entry.sk).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
                  accuracy: (entry.total?.percent_correct ?? 0) * 100,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Line type="monotone" dataKey="accuracy" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


