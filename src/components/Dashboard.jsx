import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; 
import "../styles.css";

const DashboardPage = () => {
    const { username, setUsername } = useContext(UserContext);
    const navigate = useNavigate();

    // ✅ Track selected game with state
    const [selectedGame, setSelectedGame] = useState("");

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        setUsername("");
        navigate("/");
    };

    // ✅ Handles game selection
    const handleGameSelection = () => {
        if (selectedGame) navigate(`/game/${selectedGame}`);
    };

    return (
        <div className="dashboard-page">
            <Header />
            <NavBar />
            <div className="dashboard-container">
                
                {/* ✅ Game Selection Panel */}
                <div className="panel progress">
                    <h2>Select a Game to Play</h2>
                    
                    {/* ✅ Update state on selection */}
                    <label><input type="radio" name="game" value="math" onChange={(e) => setSelectedGame(e.target.value)} /> 🧮 Math</label>
                    <label><input type="radio" name="game" value="trivia" onChange={(e) => setSelectedGame(e.target.value)} /> ❓ Trivia</label>
                    <label><input type="radio" name="game" value="reaction" onChange={(e) => setSelectedGame(e.target.value)} /> ⚡ Reaction</label>
                    <label><input type="radio" name="game" value="memory" onChange={(e) => setSelectedGame(e.target.value)} /> 🧠 Memory</label>
                    <label><input type="radio" name="game" value="sudoku" onChange={(e) => setSelectedGame(e.target.value)} /> 🔢 Sudoku</label>
                    
                    {/* ✅ Button is only enabled when a game is selected */}
                    <button class="nav-button" onClick={handleGameSelection} disabled={!selectedGame}>Play Now!</button> 
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



