// Panel.js
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles.css";

const Panel = ({ title, position, stats }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { gameType } = useParams();

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Dynamically add a modifier class based on position
  const panelClass = `panel panel--${position} ${isOpen ? "open" : "closed"}`;

  return (
    <div className={panelClass}>
      <h2 className="panel-header no-gap" onClick={togglePanel}>
        {title} {isOpen ? "▲" : "▼"}
      </h2>

      {isOpen && position === "left" && stats && (
        <div className="session-stats full-height">
          {gameType === "sudoku" ? (
            <>
              <p>📊 <strong>Score:</strong> {stats?.score || 0}</p>
              <p>⏱ <strong>Time:</strong> {stats?.timer || 0} sec</p>
              <p>❌ <strong>Mistakes:</strong> {stats?.mistakes || 0}</p>
            </>
          ) : (
            <>
              <p>📊 <strong>Score:</strong> {(Number(stats?.score) || 0).toFixed(2)}</p>
              <p>🏁 <strong>Round:</strong> {stats?.questionsAnswered || 0}/{stats?.maxRounds || 10}</p>
              <p>🎯 <strong>Accuracy:</strong> {Number(stats?.accuracy || 0).toFixed(2)}%</p>
              {gameType === "reaction" && (
                <p>⚡ <strong>Reaction Time:</strong> {stats?.reactionTime ? `${Number(stats.reactionTime).toFixed(2)}s` : "N/A"}</p>
              )}
            </>
          )}
        </div>
      )}

      {isOpen && position === "right" && (
        <div className="hints-content full-height">
          {/* Hint content based on gameType */}
        </div>
      )}
    </div>
  );
};

export default Panel;








