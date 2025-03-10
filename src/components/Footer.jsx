import React from "react";
import { useLocation } from "react-router-dom";  // ✅ Import useLocation
import "../styles.css";

const Footer = () => {
    const location = useLocation(); // ✅ Move inside the component

    // ✅ Hide buttons if playing Reaction Game
    const hideButtons = location.pathname.includes("/game/reaction") || location.pathname.includes("/game/sudoku");


    return (
        <div className="footer">
            {!hideButtons && (  // ✅ Hide buttons dynamically
                <>
                  {/*  <button className="btn reset" onClick={() => window.handleReset?.()}>
                        Reset 
                    </button> */}
                    <button className="btn submit" onClick={() => window.handleSubmit?.()}>
                        Submit Answer
                    </button>
                    <button className="btn next" onClick={() => window.handleNextTask?.()}>
                        Next Question
                    </button>
                </>
            )}
        </div>
    );
};

export default Footer;

