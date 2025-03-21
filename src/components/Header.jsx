import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";
import logo from "../assets/logo no background.png";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="header">
      <a href="/dashboard">
        <img src={logo} alt="NeuroBeacon Logo" className="header-logo" />
      </a>
      <h1 className="header-title">Welcome to NeuroBeacon!</h1>
      
      {/* Hamburger icon added */}
      <div className="nav-container" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>
      
      {menuOpen && (
        <div className="dropdown-menu">
          <button onClick={() => { setMenuOpen(false); navigate("/"); }}>🏠 Home</button>
          <button onClick={() => { setMenuOpen(false); navigate("/game"); }}>🎮 Game</button>
          <button onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}>📊 Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default Header;



