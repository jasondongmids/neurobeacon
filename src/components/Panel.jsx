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

  return (
    <div className={`panel ${isOpen ? "open" : "closed"}`}>
      <h2 className="panel-header no-gap" onClick={togglePanel}>
        {title} {isOpen ? "▲" : "▼"}
      </h2>

      {/* Left Panel: Session Stats */}
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

      {/* Right Panel: Hints */}
      {isOpen && position === "right" && (
        <div className="hints-content full-height">
          {gameType === "sudoku" ? (
            <>
              <ul className="sudoku-rules">
                <li>🧩 Fill each row, column, and 3x3 box with numbers 1-9.</li>
                <li>🚫 No duplicate numbers in any row, column, or box.</li>
                <li>💡 Click a cell, then choose a number from the pad.</li>
                <li>🔍 Use logic to deduce correct placements.</li>
                <li>⚠️ Too many mistakes may end the game!</li>
              </ul>
              <div className="bottom-buttons">
                <button
                  className="nav-btn"
                  onClick={() =>
                    window.handleSudokuPause && window.handleSudokuPause()
                  }
                >
                  Pause/Resume
                </button>
                <button
                  className="nav-btn"
                  onClick={() =>
                    window.handleSudokuRestart && window.handleSudokuRestart()
                  }
                >
                  Restart
                </button>
                <button
                  className="nav-btn"
                  onClick={() =>
                    window.handleSudokuQuit && window.handleSudokuQuit()
                  }
                >
                  Quit Game
                </button>
              </div>
            </>
          ) : window.location.pathname.includes("reaction") ? (
            <ul className="reaction-hints">
              <li>🎯 Click the green box as fast as possible!</li>
              <li>👀 Stay focused, distractions are meant to throw you off!</li>
              <li>⚡ Faster reaction times mean higher scores.</li>
              <li>💡 Train yourself to spot targets quickly under different conditions.</li>
            </ul>
          ) 
          :window.location.pathname.includes("memory") ? (
            <ul className="memory-hints">
              <li>🧠 Focus on the placement of ingredients.</li>
              <li>👀 Observe both the fridge and the kitchen.</li>
              <li>💡 Use visual cues to recall the target ingredient's location.</li>
              <li>🔄 Try to memorize the layout quickly!</li>
            </ul>
          )
          : window.location.pathname.includes("trivia") ? (
            <ul className="trivia-hints">
              <li>📖 Read all the answer choices carefully before selecting.</li>
              <li>🕵️‍♂️ Look for key hints in the question.</li>
              <li>💡 Trust your first instinct—it’s often correct!</li>
              <li>⏳ Manage your time wisely!</li>
            </ul>
          ) : (
            <ul className="default-hints">
              <li>🧠 Try breaking down the problem into smaller parts.</li>
              <li>⏳ Take your time and double-check your answer.</li>
              <li>🔍 Look for patterns that can help you solve this faster.</li>
              <li>🎯 Focus on accuracy before increasing speed.</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Panel;



