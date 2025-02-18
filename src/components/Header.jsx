import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";
import logo from "../assets/logo no background.png";

const Header = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="header">
            <img src={logo} alt="NeuroBeacon Logo" className="header-logo" />
            <h1 className="header-title">Welcome to NeuroBeacon!</h1>
            
            {menuOpen && (
                <div className="dropdown-menu">
                    <button onClick={() => navigate("/")}>🏠 Home</button>
                    <button onClick={() => navigate("/game")}>🎮 Game</button>
                    <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button> {/* ✅ Updated */}
                </div>
            )}
        </div>
    );
};

export default Header;

