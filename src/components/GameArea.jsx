import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles.css";
import FractionAdditionGame from "../games/FractionAdditionGame";
import TriviaGame from "../games/TriviaGame";
import SudokuGrid from "../games/SudokuGrid";  // ✅ Import Sudoku

const GameArea = ({ onUpdateStats }) => {
    const { gameType } = useParams();  // ✅ Get selected game from URL
    const gameRef = useRef(null);

    // ✅ Safeguard: Log a warning if an unknown gameType is detected
    useEffect(() => {
        if (!["math", "trivia", "sudoku"].includes(gameType)) {
            console.warn(`⚠️ Unknown gameType: "${gameType}" - Check routing.`);
        }
    }, [gameType]);

    useEffect(() => {
        if (!gameRef.current) return;
        console.log(`🔧 Setting up button handlers for ${gameType}...`);
        window.handleReset = () => gameRef.current?.resetInputs?.();
        window.handleSubmit = () => gameRef.current?.handleSubmit?.();
        window.handleNextTask = () => gameRef.current?.generateNewProblem?.();
    }, [gameType]);

    // ✅ Dynamically load the correct game
    const renderGame = () => {
        console.log(`🎮 Loading Game: ${gameType}`);
        switch (gameType) {
            case "math":
                return <FractionAdditionGame ref={gameRef} onUpdateStats={onUpdateStats} />;
            case "trivia":
                return <TriviaGame ref={gameRef} onUpdateStats={onUpdateStats} />;
            case "sudoku":
                return <SudokuGrid onUpdateStats={onUpdateStats} />;
            default:
                return <p className="error-message">❌ Invalid Game Selection</p>;
        }
    };

    return (
        <div className="game-container">
            {renderGame()}
        </div>
    );
};

export default GameArea;
