import React from "react";
import "../styles.css";

const Controls = () => {
    return (
        <div className="controls">
            <button className="btn reset">Reset</button>
            <button className="btn submit">Submit Answer</button>
            <button className="btn next">Next Task</button>
        </div>
    );
};

export default Controls;

