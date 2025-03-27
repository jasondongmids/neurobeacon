import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../context/UserContext";
//import NavBar from "./NavBar";
import "../styles.css";
import logo from "../assets/logo-words-no-background.png";

const WelcomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Note: confirmSignUp is assumed to be provided via the context or added later.
  const { username, setUsername, rememberMe, setRememberMe, registerUser, loginUser, resetPassword, completeSignUp } = useContext(UserContext);

  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [message, setMessage] = useState("");
  // 'view' controls which form is shown: login, register, reset, or verify.
  const [view, setView] = useState("login");

  const [showElevatorPitch, setShowElevatorPitch] = useState(false);

    // ✅ Show redirect message if user was blocked
    useEffect(() => {
        console.log("Location:", location)
        if (location.state?.redirected) {
            setMessage("⚠️ You must be logged in to access that page.");
        }
    }, [location]);

    const handleLogin = async () => {
        const response = await loginUser(inputUsername, inputPassword);
        console.log("Response:", response)
        if (response === "DONE") {
            navigate("/dashboard");
        } else {
            setMessage(response);
        }
    };

  const handleRegister = async () => {
    const response = await registerUser(inputUsername, inputPassword);
    if (response === "Registered successfully!") {
      // After registration, instruct the user to check their email.
      setMessage("A verification token has been sent to your email. Please check your email and enter the token below.");
      setView("verify");
    } else {
      setMessage(response);
    }
  };

const handleVerifyToken = async () => {
  // Call the backend function to verify the token (using AWS Amplify or your custom endpoint)
  const response = await completeSignUp(inputUsername, verificationToken);
  
  if (response === "CONFIRMED") {
    // Display a success message and navigate to the dashboard after a short delay
    setMessage("Your account has been verified! Please login.");
    setView("login")
  if (response === "INVALID") {
    setMessage("Invalid verification code, please try again.")
  }
  } else {
    // If verification fails, display an error message
    setMessage(response);
  }
};


  const handlePasswordReset = () => {
    const newPassword = prompt("🔐 Enter a new password:");
    if (newPassword) {
      const response = resetPassword(inputUsername, newPassword);
      setMessage(response);
      setView("login"); // Return to login after password reset
    }
  };

  return (
    <div className="welcome-container">
      {/* <NavBar /> */}
      <img src={logo} alt="NeuroBeacon Logo" className="welcome-logo" />
      <h1>Welcome to NeuroBeacon</h1>
      <p>Train your brain and track your progress!</p>

      {/* Beta Test Message with Email Link */}
      <div className="elevator-pitch-link">
        <h3>
          Thank you for joining us for our Beta Test!<br /> Mobile development is still ongoing, and there may still be some bugs.
          <br />
          Learn more about us by clicking the link below or enter an email and select a password to jump right in.
          <br />
          When you are done, please be sure to fill out our <a href="https://docs.google.com/forms/d/1v-kiT9EV2i8t46WY0D_ZecNFgJCokyxXDVir5CrmbAI/viewform?edit_requested=true"target="_blank"
        rel="noopener noreferrer">User Satisfaction Survey</a></strong> and tell us how we can make NeuroBeacon even better.
          <br />
          If you have any questions or concerns, please email us at{" "}
          <a href="mailto:fhayes3@berkeley.edu">fhayes3@berkeley.edu</a>.<br /><strong>THIS OPEN BETA WILL CLOSE ON FRIDAY, APRIL 4!</strong>
        </h3>
        <button className="auth-btn secondary" onClick={() => setShowElevatorPitch(true)}>
          Learn More About NeuroBeacon
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {/* Username Input */}
      <input
        type="text"
        className="input-field"
        placeholder="Enter your email"
        value={inputUsername}
        onChange={(e) => setInputUsername(e.target.value)}
      />

      {/* Password Input (hidden for Reset view) */}
      {view !== "reset" && (
        <input
          type="password"
          className="input-field"
          placeholder="Enter your password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
        />
      )}

      {/* Verification Token Input - visible only in 'verify' view */}
      {view === "verify" && (
        <input
          type="text"
          className="input-field"
          placeholder="Enter verification token"
          value={verificationToken}
          onChange={(e) => setVerificationToken(e.target.value)}
        />
      )}

      {/* Button Container */}
      <div className="button-container">
        {view === "login" && <button className="auth-btn" onClick={handleLogin}>Login</button>}
        {view === "register" && <button className="auth-btn" onClick={handleRegister}>Register</button>}
        {view === "reset" && <button className="auth-btn" onClick={handlePasswordReset}>Reset Password</button>}
        {view === "verify" && <button className="auth-btn" onClick={handleVerifyToken}>Verify Token</button>}
      </div>

      {/* Authentication Options */}
      <div className="auth-options">
        {view !== "reset" && view !== "verify" && (
          <>
            <button onClick={() => setView(view === "login" ? "register" : "login")}>
              {view === "login" ? "New user? Register here" : "Already have an account? Log in"}
            </button>
            <button onClick={() => setView("reset")}>Forgot Password?</button>
          </>
        )}
        {(view === "reset" || view === "verify") && (
          <button onClick={() => setView("login")}>⬅ Back to Login</button>
        )}
      </div>

      {/* Elevator Pitch Modal */}
      {showElevatorPitch && (
        <div className="modal-overlay-elevator">
          <div className="modal-content-elevator">
            <p>
              Tenebris ad sinus custodi—Hold back the darkness. That’s our mission. Cognitive decline is a growing global challenge, and while no single solution exists, the power of mental engagement is undeniable. But too often, brain training feels disconnected from reality—rigid, repetitive, and uninspiring.
            </p>
            <p>
              That’s where NeuroBeacon comes in. We’re building a game-based cognitive training platform that isn’t just about sharpening the mind—it’s about engagement, adaptability, and joy. Our interactive challenges—from math-based problem-solving to rapid-recall to remembering what you have in your fridge or testing your reaction time while driving—are designed to reflect real-world thinking and decision-making, making learning feel both natural and rewarding.
            </p>
            <p>
              At the core of NeuroBeacon is an adaptive difficulty engine, powered by reinforcement learning principles. Instead of static difficulty settings, the platform evaluates each player's accuracy, speed, and interaction patterns in real-time. When a player solves problems efficiently, the game presents more complex challenges. If they struggle, the system adjusts to provide scaffolded learning opportunities, ensuring they remain engaged without frustration.
            </p>
            <p>
              This is what sets NeuroBeacon apart. Unlike traditional brain training apps that rely on fixed difficulty tiers, our system learns from the player, adapting at a pace that keeps them in their optimal learning zone—challenged, but not overwhelmed.
            </p>
            <p>
              We believe cognitive training should feel like play, not work. Whether it’s solving math puzzles in a restaurant setting, answering decade-based trivia, or tackling Sudoku-style logic challenges, NeuroBeacon transforms everyday thinking into an engaging experience. Looking ahead, we’re expanding our game library and refining our reinforcement learning model to create a truly personalized training experience. The end game? A platform that doesn’t just challenge users—but learns with them.
            </p>
            <p>
              Our goal is simple: Entertain. Sharpen. Spark Joy. If you’re interested in AI-driven game mechanics, cognitive adaptation, or just love fun and challenging experiences, we invite you to join Kara, Jason, Alice, Mia, and myself. We’d love to hear your thoughts, and we thank you for your time and consideration.
            </p>
            <p>-Fred Hayes</p>
            <button className="auth-btn" onClick={() => setShowElevatorPitch(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
