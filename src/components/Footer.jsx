import React from "react";
import { useLocation } from "react-router-dom";
import "../styles.css";

const Footer = () => {
  const location = useLocation();

  // Flag to hide both Submit & Next (Reaction or Sudoku)
  const hideBothButtons =
    location.pathname.includes("/game/reaction") ||
    location.pathname.includes("/game/sudoku");

  // Flag to hide only Next (Memory)
  const hideNextButton = location.pathname.includes("/game/memory");

  return (
    <div className="footer">
      {/* If it's Reaction or Sudoku, we hide everything inside. */}
      {!hideBothButtons && (
        <>
          {/* Show Submit button for all except Reaction/Sudoku */}
          <button className="btn submit" onClick={() => window.handleSubmit?.()}>
            Submit Answer
          </button>

          {/* Hide Next button only if it’s Memory. */}
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


