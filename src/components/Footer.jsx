import React from "react";
import "../styles.css";

const Footer = () => {
    return (
        <div className="footer">
            <button className="btn reset" onClick={() => window.handleReset?.()}>
                Reset
            </button>
            <button className="btn submit" onClick={() => window.handleSubmit?.()}>
                Submit Answer
            </button>
            <button className="btn next" onClick={() => window.handleNextTask?.()}>
                Next Task
            </button>
        </div>
    );
};

export default Footer;
