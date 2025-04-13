import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";  // ✅ Import useParams to get game type
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar";
import Panel from "./Panel";
import GameArea from "./GameArea";
import Footer from "./Footer";
import imageList from "../data/data"; // ✅ Correct path to `data.js`
import "../styles.css";

const GamePage = () => {
    const { username } = useContext(UserContext);
    const { gameType } = useParams(); // ✅ Get the game type from the URL
    const [sessionStats, setSessionStats] = useState({
        score: 0,
        correctAnswers: 0,
        questionsAnswered: 0,
        accuracy: "0.00"
    });

    // ✅ Function to update stats (passed to GameArea)
    const handleUpdateStats = (newStats) => {
        console.log("📊 [GamePage] Updating session stats:", newStats);
        setSessionStats(newStats);
    };

    const gameGreeting =
        gameType === "math"
          ? "Ready for some fun with math? 🔢"
          : gameType === "trivia"
          ? "Time to test your knowledge! ❓"
          : gameType === "reaction"
          ? "Get set, ready, GO! ⚡ Test your reaction speed!"
          : gameType === "sudoku"
          ? "Sharpen your logic and solve the puzzle! 🧩"
          : gameType === "memory"
          ? "Time to test your memory! 🧠"
          : "Ready to train? 🧠";

    return (
        <div className="game-page">
            <Header />
            <NavBar />
            <h2 className="greeting">
              Hello, {username || "Player"}! {gameGreeting}
            </h2>
 {/*<p>This open beta will close on Friday, April 4!<br />Before you leave, please fill out our <a href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"target="_blank"
        rel="noopener noreferrer">User Survey</a> so we can make NeuroBeacon even better!</p> */}
            {/* ✅ Main Layout */}
            <div className="main-container">
                {/* ✅ Left Panel: Session Stats */}
                <Panel title="Session Stats" position="left" stats={sessionStats} />

                {/* ✅ Game Area (Game Only) */}
                <div className="game-content">
                    <GameArea onUpdateStats={handleUpdateStats} />
                </div>

                {/* ✅ Right Panel: Hints */}
                <Panel title="Hints" position="right" />
            </div>

        {/* ✅ Hide footer for reaction game */}
        {gameType !== "reaction" && <Footer />}
        </div>
    );
};

export default GamePage;




