import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; 
import "../styles.css";

const DashboardPage = () => {
    const { username, setUsername } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("currentUser");  // ✅ Clear stored username
        setUsername(""); // ✅ Reset username in context
        navigate("/"); // ✅ Redirect to Welcome Page
    };

    return (
        <div className="dashboard-page">
            <Header />
            <NavBar /> {/* ✅ Keeps Hamburger Menu */}
            <div className="dashboard-container">
                <div className="panel profile">
                    <h2>🧑‍💼 {username || "Your Profile"}</h2>
                    <img
                        src={require("../assets/profile-placeholder.png")}
                        alt="User Avatar"
                        className="profile-image"
                    />
                    <p><strong>Username:</strong> {username || "NeuroUser42"}</p>
                    <p><strong>Games Played:</strong> 120</p>
                    <p><strong>Current Streak:</strong> 🔥 14 Days</p>
                    <p><strong>Achievements:</strong> 🏅 Brain Trainer Level 3</p>
                </div>

                <div className="panel progress">
                    <h2>📊 Progress Overview</h2>
                    <img
                        src={require("../assets/progress.png")}
                        alt="User Progress Chart"
                        className="stats-image"
                    />
                    <p>You're improving! Keep pushing forward to increase your streak! 🚀</p>
                </div>

                <div className="panel settings">
                    <h2>⚙️ Settings & Preferences</h2>
                    <label><input type="checkbox" checked /> Enable Hints</label>
                    <label><input type="checkbox" /> Sound Effects</label>
                    <label><input type="checkbox" /> Dark Mode</label>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>  {/* ✅ Fully Functional Logout */}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;



