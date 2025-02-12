import React from "react";
import "../styles.css";

const Panel = ({ title, position }) => {
    return (
        <div className="panel">
            <h2>{title}</h2>
            {position === "left" ? (
                <>
                                    <img 
                        src={require("../assets/progress.png")} 
                        alt="User Progress Chart" 
                        className="stats-image"
                    />
                    <p>📝 Game progress, accuracy stats, and instructions will go here.</p>

                </>
            ) : (
                <>
                                  <ul className="hint-list">
                        <li>🧠 **Try breaking down the problem into smaller parts.**</li>
                        <li>⏳ **Take your time and double-check your answer.**</li>
                        <li>🔍 **Look for patterns that can help you solve this faster.**</li>
                        <li>🎯 **Focus on accuracy before increasing speed.**</li>
                    </ul>
                    <p>💡 Hints, feedback, and tips for improvement will go here.</p>

                    <div className="bottom-buttons">
                        <button className="nav-btn">Pause</button>
                        <button className="nav-btn">Help</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Panel;



