import React, { useContext } from "react";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; // ✅ Ensure Hamburger Menu is Here
import Panel from "./Panel";
import GameArea from "./GameArea";
import Footer from "./Footer";
import "../styles.css";

const GamePage = () => {
    const { username } = useContext(UserContext);

    return (
        <div className="game-page">
            <Header />
            <NavBar /> {/* ✅ Keeps Hamburger Menu */}
            <h2 className="greeting">Hello, {username || "Player"}! Ready to train? 🧠</h2>
            <div className="main-container">
                <Panel title="Stats/Instructions Panel" position="left" />
                <GameArea />
                <Panel title="Hints/Feedback Panel" position="right" />
            </div>
            <Footer />
        </div>
    );
};

export default GamePage;





