import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";
import logo from "../assets/logo no background.png";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="header">
      {/* Logo on left */}
      <a href="/dashboard">
        <img src={logo} alt="NeuroBeacon Logo" className="header-logo" />
      </a>

      {/* Title in center */}
      <h1>Welcome to NeuroBeacon!</h1>

      {/* Hamburger on right */}
      <div className="nav-container" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      {/* Dropdown menu if open */}
      {menuOpen && (
        <div className="dropdown-menu">
          <button onClick={() => navigate("/")}>🏠 Home</button>
          <button onClick={() => navigate("/game")}>🎮 Game</button>
          <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default Header;


