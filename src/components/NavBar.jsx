import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import ThemeContext from "../context/ThemeContext"; 
import "../styles.css";

const NavBar = () => {
  const navigate = useNavigate();
  // Include logoutUser from UserContext
  const { username, logoutUser } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { isDark, setIsDark } = useContext(ThemeContext);
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle navigation & redirect with message if user isn't logged in
  const handleNavigation = (path) => {
    if (!username) {
      navigate("/", { state: { redirected: true } });
    } else {
      navigate(path);
    }
    setMenuOpen(false);
  };

  // Handle logout: call logoutUser, clear localStorage, then navigate to home
  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem("currentUser");
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="nav-container">
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>
      {menuOpen && (
        <div className="dropdown-menu" ref={menuRef}>
         <button onClick={() => handleNavigation("/dashboard")}>
            📊 Dashboard
          </button>
          <button onClick={handleLogout}>
          🔓 Logout
          </button>
         {/* ✅ Dark mode toggle */}
          <button onClick={() => setIsDark((prev) => !prev)}>
            {isDark ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      )}
    </div>
  );
};

export default NavBar;




