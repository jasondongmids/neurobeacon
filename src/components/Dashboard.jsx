// ✅ 1. Core React and Hooks
import React, { useContext, useState, useEffect } from "react";

// ✅ 2. React Router
import { useNavigate, useLocation, data } from "react-router-dom";

// ✅ 3. Context Providers
import ThemeContext from "../context/ThemeContext";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext";

// ✅ 4. Components and Styles
import Header from "./Header";
import NavBar from "./NavBar";
import "../styles.css";

// ✅ Utility
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const gameColors = {
  all: "rgb(75, 192, 192)",
  math: "#f39c12",       // orange
  trivia: "#8e44ad",     // purple
  reaction: "#e74c3c",   // red
  memory: "#2ecc71",     // green
  sudoku: "#3498db"      // blue
};

const DashboardPage = () => {
  const { username, setUsername, logoutUser } = useContext(UserContext);
  const { userStats, dailyStats, queryStats, getUserAttributes } = useContext(UserStatisticsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, setIsDark } = useContext(ThemeContext);

  const [selectedGame, setSelectedGame] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGameForStats, setSelectedGameForStats] = useState(
  localStorage.getItem("chartGame") || "all"
  );
  const [chartInstance, setChartInstance] = useState(null);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [range, setRange] = useState(
  localStorage.getItem("chartRange") || "7"
  );
  const [displayName, setDisplayName] = useState(null)

useEffect(() => {
  if (location.state?.redirected) {
    setMessage("⚠️ You must be logged in to access that page.");
  }
}, [location]);

// Fetch data whenever range changes
useEffect(() => {
  const fetchChartData = async () => {
    const data = await queryStats("daily", parseInt(range));
    if (Array.isArray(data)) {
      console.log("🧩 Sample daily entry:", data[0]);
      const sortedData = data.sort((a, b) => a.sk - b.sk);
      setDailyHistory(sortedData);
    }
  };

  fetchChartData();
}, [range]);


// Update Chart.js graph when dailyHistory changes
useEffect(() => {
  if (!window.Chart || !dailyHistory.length) return;
  const filteredHistory = selectedGameForStats === "all"
    ? dailyHistory
    : dailyHistory.map((entry) => {
        const gameStats = entry[selectedGameForStats];
        if (!gameStats) {
          console.warn(`⚠️ No data found for game: ${selectedGameForStats} on ${entry.sk}`);
        }
        return {
          ...entry,
          total: {percent_correct: gameStats?.percent_correct} || { percent_correct: 0 }
        };
      });

  const labels = filteredHistory.map(entry =>
    String(entry.sk).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
  );

  const dataPoints = filteredHistory.map(entry =>
    (entry.total?.percent_correct ?? 0) * 100
  );

  const ctx = document.getElementById("chartjs-canvas")?.getContext("2d");
  if (!ctx) return;

  if (chartInstance) chartInstance.destroy();

  const newChart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: selectedGameForStats === "all" ? "Overall Accuracy" : `Accuracy: ${capitalize(selectedGameForStats)}`,
        data: dataPoints,
        borderColor: gameColors[selectedGameForStats],
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (val) => `${val}%`
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.parsed.y.toFixed(2)}%`
          }
        }
      }
    }
  });

  setChartInstance(newChart);
}, [dailyHistory, selectedGameForStats]);




  // TEMP LOGGING TO VALIDATE SAFE CHART INTEGRATION
  useEffect(() => {
    console.log("🧠 DashboardPage mounted");
    console.log("👤 Username:", username);
    console.log("📊 userStats:", userStats);
    console.log("📅 dailyStats:", dailyStats);
  
    if (dailyStats?.sk && dailyStats?.total?.percent_correct !== undefined) {
      const fakeChartData = [{
        date: String(dailyStats.sk).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
        accuracy: (dailyStats.total.percent_correct ?? 0) * 100
      }];
      console.log("📈 Test Chart Data:", fakeChartData);
    } else {
      console.log("⚠️ Not enough data to create chart data yet.");
    }
  }, [username, userStats, dailyStats]);

  getUserAttributes().then((result) => {
    if (result) {
      setDisplayName(result.nickname)
    } else if (username) {
      setDisplayName(username)
    } else {
      setDisplayName("Your Profile")
    }
  })

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
          <h2 className="dboardH2">Hello {displayName}!</h2>
          <h3>Check out your streak numbers below</h3>
          <div className="dashboard-stats">
            <p><strong>Total Games Played:</strong> {totalGames}</p>
            <p><strong>Streak:</strong> {streak} days 🔥</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
          <button className="auth-btn" onClick={() => setIsDark((prev) => !prev)}> {isDark ? "☀ Light Mode" : "🌙 Dark Mode"}</button>
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
          <h2 className="dboardH2">📊 {displayName}'s Progress Overview</h2>
          <div className="chart-container" style={{ marginTop: "20px" }}>
            <h3>
              📊 {selectedGameForStats === "all" ? "Overall Progress" : `${capitalize(selectedGameForStats)} Progress`}
            </h3>
            <div className="dropdown-wrapper">
              <div className="dropdown-group">
                <label>📅 View Range:</label>
                <select
                  value={range}
                  onChange={(e) => {
                    setRange(e.target.value);
                    localStorage.setItem("chartRange", e.target.value);
                  }}
                >
                  <option value="7">🗓️ Past Week</option>
                  <option value="30">📅 Past Month</option>
                  <option value="999">📈 Lifetime</option>
                </select>
              </div>
              <div className="dropdown-group">
                <label>🎮 Game:</label>
                <select value={selectedGameForStats}
                    onChange={(e) => {
                      setSelectedGameForStats(e.target.value);
                      localStorage.setItem("chartGame", e.target.value);
                    }}
                  >
                  <option value="all">🧠 All Games</option>
                  <option value="math">🧮 Math</option>
                  <option value="trivia">❓ Trivia</option>
                  <option value="reaction">⚡ Reaction</option>
                  <option value="memory">🧠 Memory</option>
                  <option value="sudoku">🔢 Sudoku</option>
                </select>
              </div>
            </div>
          
            <canvas id="chartjs-canvas" width="400" height="200"></canvas>
            {dailyHistory.length === 0 && (
              <p style={{ color: "black", textAlign: "center" }}>
                Not enough data yet. Keep playing to see your progress!
              </p>
            )}
          </div>


          <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
          </div>
      </div>
    </div>
  );

};
export default DashboardPage;
