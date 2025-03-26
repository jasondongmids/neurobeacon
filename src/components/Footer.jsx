import React from "react";
import { useLocation, useParams } from "react-router-dom";
import "../styles.css";

const Footer = () => {
  const location = useLocation();
  const { gameType } = useParams();

  // For the Sudoku game, render its specific buttons in the footer.
  if (gameType === "sudoku") {
    return (
      <div className="footer">
        <div className="sudoku-footer-buttons">
          <button
            className="btn next"
            onClick={() => window.handleSudokuPause && window.handleSudokuPause()}
          >
            Pause/Resume
          </button>
          <button
            className="btn next"
            onClick={() => window.handleSudokuRestart && window.handleSudokuRestart()}
          >
            Restart
          </button>
          <button
            className="btn next"
            onClick={() => window.handleSudokuQuit && window.handleSudokuQuit()}
          >
            Quit Game
          </button>
        </div>
      </div>
    );
  }
  if (gameType === "memory") {
    return (
      <div className="footer">
          <button className="btn submit" onClick={() => window.handleSubmit?.()}>
            Submit Answer
          </button>

      </div>
    );
  }

    if (gameType === "reaction") {
    return (
      <div className="footer">


      </div>
    );
  }
}

export default Footer;



