import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

    // ✅ State to track selected game
    const [selectedGame, setSelectedGame] = useState("");

    useEffect(() => {
        console.log("Location:", location)
        if (location.state?.redirected) {
            setMessage("⚠️ You must be logged in to access that page.");
        }
    }, [location]);

    const handleLogout = async () => {
        await logoutUser()
    const handleLogout = () => {
        logoutUser()
        localStorage.removeItem("currentUser");
        setUsername("");
        navigate("/");
    };

    // ✅ Handles game selection and navigation
    const handleGameSelection = () => {
        if (selectedGame) navigate(`/game/${selectedGame}`);
    };

    return (
        <div className="dashboard-page">
            <Header />
            <NavBar />
            <div className="dashboard-container">
                
                {/* ✅ Profile Section */}
                <div className="panel profile">
                    <h2>🧑‍💼 {username || "Your Profile"}</h2>
                    <img
                        src={profilePlaceholder}  // ✅ Now using ES6 import
                        alt="User Avatar"
                        className="profile-image"
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
                        src={progressChart}  // ✅ Now using ES6 import
                        alt="User Progress Chart"
                        className="stats-image"
                    />
                    <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
                </div>

                {/* ✅ Game Selection Panel */}
                <div className="panel progress">
                    <h2>Select a Game to Play</h2>
                    
                    {/* ✅ Use state to track selection */}
                    <label><input type="radio" name="game" value="math" onChange={(e) => setSelectedGame(e.target.value)} /> 🧮 Math</label>
                    <label><input type="radio" name="game" value="trivia" onChange={(e) => setSelectedGame(e.target.value)} /> ❓ Trivia</label>
                    <label><input type="radio" name="game" value="reaction" onChange={(e) => setSelectedGame(e.target.value)} /> ⚡ Reaction</label>
                    <label><input type="radio" name="game" value="memory" onChange={(e) => setSelectedGame(e.target.value)} /> 🧠 Memory</label>
                    <label><input type="radio" name="game" value="sudoku" onChange={(e) => setSelectedGame(e.target.value)} /> 🔢 Sudoku</label>
                    <br></br>
                    {/* ✅ Enable button only when a game is selected */}
                    <button className="nav-btn" onClick={handleGameSelection} disabled={!selectedGame}>
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



