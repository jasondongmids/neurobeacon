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
          <p>This open beta will close on Friday, April 4!<br />Before you leave, please fill out our <a href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"target="_blank"
        rel="noopener noreferrer">User Survey</a> so we can make NeuroBeacon even better!</p>
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



