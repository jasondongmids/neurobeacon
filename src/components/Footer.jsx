import React from "react";
import { useLocation } from "react-router-dom";
import "../styles.css";

const Footer = () => {
  const location = useLocation(); // Define location from react-router-dom
  const hideButtons = location.pathname.includes("/game/reaction");

  return (
    <div className="footer">
      {!hideButtons && (
        <>
          {/*  <button className="btn reset" onClick={() => window.handleReset?.()}>
            Reset
          </button> */}
          <button className="btn submit" onClick={() => window.handleSubmit?.()}>
            Submit Answer
          </button>
          <button className="btn next" onClick={() => window.handleNextTask?.()}>
            Next Task
          </button>
        </>
      )}
    </div>
  );
};

export default Footer;
