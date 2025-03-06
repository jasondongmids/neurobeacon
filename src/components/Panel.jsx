import React, { useState } from "react";
import "../styles.css";
import progressImg from "../assets/progress.png"

const Panel = ({ title, position, stats }) => {
    const [isOpen, setIsOpen] = useState(true);

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`panel ${isOpen ? "open" : "closed"}`}>
            {/* ✅ Collapsible Header - No Gap */}
            <h2 className="panel-header no-gap" onClick={togglePanel}>
                {title} {isOpen ? "▲" : "▼"}
            </h2>

            {/* ✅ Left Panel: Session Stats (Expands Fully) */}
            {isOpen && position === "left" && stats && (
                <div className="session-stats full-height">
                    <p>📊 <strong>Score:</strong> {stats.score}</p>
                    <p>✅ <strong>Correct Answers:</strong> {stats.correctAnswers}</p>
                    <p>❓ <strong>Questions Answered:</strong> {stats.questionsAnswered}</p>
                    <p>🎯 <strong>Accuracy:</strong> {stats.accuracy}%</p>
                </div>
            )}

{/* ✅ Right Panel: Dynamic Hints */}
{isOpen && position === "right" && (
    <div className="hints-content full-height">
                    {window.location.pathname.includes("reaction") ? (
                        <ul className="reaction-hints">
                            <li>🎯 Click the green box as fast as possible!</li>
                            <li>👀 Stay focused, distractions are meant to throw you off!</li>
                            <li>⚡ Faster reaction times mean higher scores.</li>
                            <li>💡 Train yourself to spot targets quickly under different conditions.</li>
                        </ul>
                    ) : window.location.pathname.includes("sudoku") ? (
                        <ul className="sudoku-rules">
                            <li>🧩 Fill each row, column, and 3x3 box with numbers 1-9.</li>
                            <li>🚫 No duplicate numbers in any row, column, or box.</li>
                            <li>💡 Click a cell, then choose a number from the pad.</li>
                            <li>🔍 Use logic to deduce correct placements.</li>
                            <li>⚠️ Too many mistakes may end the game!</li>
                        </ul>
                    ) : window.location.pathname.includes("trivia") ? (
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

        <div className="bottom-buttons">
            <button className="nav-btn">Pause</button>
            <button className="nav-btn">Help</button>
        </div>
    </div>
)}

        </div>
    );
};

export default Panel;



