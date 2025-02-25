import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; 
import "../styles.css";
import progressChart from "../assets/progress.png";
import profileplaceholder from "/assets/profile-placeholder.png";


const DashboardPage = () => {
    const { username, setUsername } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("currentUser");  // ✅ Clear stored username
        setUsername(""); // ✅ Reset username in context
        navigate("/"); // ✅ Redirect to Welcome Page
    };

    // ✅ Handles game selection
    const handleGameSelection = () => {
        const selectedGame = document.querySelector('input[name="game"]:checked')?.value;
        if (selectedGame) navigate(`/game/${selectedGame}`);
    };

    return (
        <div className="dashboard-page">
            <Header />
            <NavBar /> {/* ✅ Keeps Hamburger Menu */}
            <div className="dashboard-container">
                
                {/* ✅ Profile Section */}
                <div className="panel profile">
                    <h2>🧑‍💼 {username || "Your Profile"}</h2>
                    <img
                        src={progressChart} 
                        alt="User Profile Placeholder"
                        className="profileplaceholder"
                    />
                    <p><strong>Username:</strong> {username || "NeuroUser42"}</p>
                    <p><strong>Games Played:</strong> 120</p>
                    <p><strong>Current Streak:</strong> 🔥 14 Days</p>
                    <p><strong>Achievements:</strong> 🏅 Brain Trainer Level 3</p>
                </div>

                {/* ✅ Progress Overview */}
                <div className="panel progress">
                    <h2>📊 Progress Overview</h2>
                    <img
                        src={progressChart} 
                        alt="User Progress Chart"
                        className="stats-image"
                    />
                    <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
                </div>

                {/* ✅ Game Selection Panel */}
                <div className="panel progress">
                    <h2>Select a Game to Play</h2>
                    <label><input type="radio" name="game" value="math" /> 🧮 Math</label>
                    <label><input type="radio" name="game" value="trivia" /> ❓ Trivia</label>
                    <label><input type="radio" name="game" value="reaction" /> ⚡ Reaction</label>
                    <label><input type="radio" name="game" value="memory" /> 🧠 Memory</label>
                    <label><input type="radio" name="game" value="sudoku" /> 🔢 Sudoku</label>  {/* ✅ Sudoku Added! */}
                    <button onClick={handleGameSelection} disabled={!document.querySelector('input[name="game"]:checked')}>
                        Play Now!
                    </button>

                </div>

                {/* ✅ Settings Panel */}
                <div className="panel settings">
                    <h2>⚙️ Settings & Preferences</h2>
                    <label><input type="checkbox" checked /> Enable Hints</label>
                    <label><input type="checkbox" /> Sound Effects</label>
                    <label><input type="checkbox" /> Dark Mode</label>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>  
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;



