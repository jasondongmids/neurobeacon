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
            className="nav-btn"
            onClick={() => window.handleSudokuPause && window.handleSudokuPause()}
          >
            Pause/Resume
          </button>
          <button
            className="nav-btn"
            onClick={() => window.handleSudokuRestart && window.handleSudokuRestart()}
          >
            Restart
          </button>
          <button
            className="nav-btn"
            onClick={() => window.handleSudokuQuit && window.handleSudokuQuit()}
          >
            Quit Game
          </button>
        </div>
      </div>
    );
  }

  // For other games, you might have different button logic.
  const hideBothButtons = location.pathname.includes("/game/reaction");
  const hideNextButton = location.pathname.includes("/game/memory");

  return (
    <div className="footer">
      {!hideBothButtons && (
        <>
          <button className="btn submit" onClick={() => window.handleSubmit?.()}>
            Submit Answer
          </button>
          {!hideNextButton && (
            <button className="btn next" onClick={() => window.handleNextTask?.()}>
              Next Question
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Footer;



