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

  // For other games, you might have different button logic.
  const hideBothButtons = location.pathname.includes("/game/reaction");
  const hideNextButton = location.pathname.includes("/game/memory");

  return (
    <div className="footer">
      {!hideNextButton && (
        <>
            <button className="btn next" onClick={() => window.handleNextTask?.()}>
              Skip Question
            </button>
          {!hideBothButtons && (
          <button className="btn submit" onClick={() => window.handleSubmit?.()}>
            Submit Answer
          </button>
          )}
        </>
      )}
    </div>
  );
};

export default Footer;



