import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../context/UserContext";
import NavBar from "./NavBar";
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
    // setTimeout(() => {
    //   navigate("/dashboard");
    // }, 2000); // 2-second delay before redirection
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
      <NavBar />
      <img src={logo} alt="NeuroBeacon Logo" className="welcome-logo" />
      <h1>Welcome to NeuroBeacon</h1>
      <p>Train your brain and track your progress!</p>

      {message && <p className="message">{message}</p>}

      {/* Username Input */}
      <input 
        type="text"
        className="input-field"
        placeholder="Enter your username"
        value={inputUsername}
        onChange={(e) => setInputUsername(e.target.value)}
      />

      {/* Password Input (only hidden in Reset view if needed) */}
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
    </div>
  );
};

export default WelcomePage;






