import React from "react";
import { useLocation, useParams } from "react-router-dom";
import "../styles.css";

const Footer = () => {
  const location = useLocation();
  const { gameType } = useParams();

  // Sudoku Footer Buttons
  if (gameType === "sudoku") {
    return (
      <div className="footer">
        <div className="sudoku-footer-buttons">
          <button className="btn next" onClick={() => window.handleSudokuPause?.()}>
            Pause/Resume
          </button>
          <button className="btn next" onClick={() => window.handleSudokuRestart?.()}>
            Restart
          </button>
          <button className="btn next" onClick={() => window.handleSudokuQuit?.()}>
            Quit Game
          </button>
        </div>
      </div>
    );
  }

  // Memory Game Footer
  if (gameType === "memory") {
    return (
      <div className="footer">
        <button className="btn submit" onClick={() => window.handleSubmit?.()}>
          Submit Answer
        </button>
      </div>
    );
  }

  // Reaction Game Footer (Empty for now, but can be expanded)
  if (gameType === "reaction") {
    return <div className="footer"></div>;
  }

  // Trivia & Math Footer (Both should have "Skip" and "Submit" buttons)
  if (gameType === "trivia" || gameType === "math") {
    return (
      <div className="footer">
        <button className="btn next" onClick={() => window.handleNextTask?.()}>
          Skip Question
        </button>
        <button className="btn submit" onClick={() => window.handleSubmit?.()}>
          Submit Answer
        </button>
      </div>
    );
  }

  return null; // Default case if no gameType matches
};

export default Footer;



