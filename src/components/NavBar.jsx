import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import "../styles.css";

const NavBar = () => {
    const navigate = useNavigate();
    const { username } = useContext(UserContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // ✅ Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ Handle navigation & redirect with message if user isn't logged in
    const handleNavigation = (path) => {
        if (!username) {
            navigate("/", { state: { redirected: true } }); // ✅ Redirect with message
        } else {
            navigate(path);
        }
        setMenuOpen(false); // Close menu after clicking
    };

    return (
        <div className="nav-container">
            <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>☰</div>
            {menuOpen && (
                <div className="dropdown-menu" ref={menuRef}>
                    <button onClick={() => navigate("/")}>🏠 Home</button>
                    {/*<button onClick={() => handleNavigation("/game")}>🎮 Game</button> */}
                    <button onClick={() => handleNavigation("/dashboard")}>📊 Dashboard</button>
                </div>
            )}
        </div>
    );
};

export default NavBar;



