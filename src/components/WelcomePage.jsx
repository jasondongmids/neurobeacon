import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../context/UserContext";
import NavBar from "./NavBar";
import "../styles.css";
import logo from "../assets/logo-words-no-background.png";

const WelcomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { username, setUsername, rememberMe, setRememberMe, registerUser, loginUser, resetPassword } = useContext(UserContext);

    const [inputUsername, setInputUsername] = useState("");
    const [inputPassword, setInputPassword] = useState("");
    const [message, setMessage] = useState("");
    const [view, setView] = useState("login"); // ✅ Controls which view is shown: login, register, reset

    // ✅ Show redirect message if user was blocked
    useEffect(() => {
        if (location.state?.redirected) {
            setMessage("⚠️ You must be logged in to access that page.");
        }
    }, [location]);

    // const handleLogin = () => {
    //     const response = loginUser(inputUsername, inputPassword);
    //     if (response === "Login successful!") {
    //         navigate("/game");
    //     } else {
    //         setMessage(response);
    //     }
    // };


    const handleLogin = async () => {
        try {     // ✅ If user already logged in and skip login screen
            const currentUser = await getCurrentUser().catch(() => null);
            if (currentUser) {
                console.log("User already signed in", currentUser);
                navigate("/game");
                return;
            }

            // New Login
            const response = await signIn({
                username: inputUsername,
                password: inputPassword,
            });
            console.log("Sign in response:", response);

            if (response.nextStep === "DONE") {
                navigate("/game");
            } else {
                setMessage("Login successful, but additional steps are required");
            }
        } catch (error) {
            console.error("Sign in error:", error);
            setMessage(error.message || "Failed to log in. Please try again.")
        }
    };

    // const handleRegister = () => {
    //     const response = registerUser(inputUsername, inputPassword);
    //     if (response === "Registered successfully!") {
    //         navigate("/game");
    //     } else {
    //         setMessage(response);
    //     }
    // };

    const handleRegister = async () => {
        try {
            const response = await signUp({
                username: inputUsername,
                password: inputPassword,
                option: {
                    autoConfirm: true,
                }
            });
            console.log("Sign up successful:", response);
            setMessage("Registered successfully! Please check your email to verify your account")
        } catch (error) {
            console.error("Sign up error:", error);
            setMessage(error.message || "An error occurred during registration.");
        }
    };

    const handlePasswordReset = () => {
        const newPassword = prompt("🔐 Enter a new password:");
        if (newPassword) {
            const response = resetPassword(inputUsername, newPassword);
            setMessage(response);
            setView("login"); // ✅ Return to login after password reset
        }
    };

    return (
        <div className="welcome-container">
            <NavBar />
            <img src={logo} alt="NeuroBeacon Logo" className="welcome-logo" />
            <h1>Welcome to NeuroBeacon</h1>
            <p>Train your brain and track your progress!</p>

            {/* ✅ Show redirect message if user was blocked */}
            {message && <p className="message">{message}</p>}

            {/* Username Input */}
            <input 
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
            />

            {/* Password Input (Hidden for Forgot Password Mode) */}
            {view !== "reset" && (
                <input 
                    type="password"
                    className="input-field"
                    placeholder="Enter your password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                />
            )}

            {/* Button Container */}
            <div className="button-container">
                {view === "login" && <button className="auth-btn" onClick={handleLogin}>Login</button>}
                {view === "register" && <button className="auth-btn" onClick={handleRegister}>Register</button>}
                {view === "reset" && <button className="auth-btn" onClick={handlePasswordReset}>Reset Password</button>}
            </div>

            {/* Authentication Options */}
            <div className="auth-options">
                {view !== "reset" && (
                    <>
                        <button onClick={() => setView(view === "login" ? "register" : "login")}>
                            {view === "login" ? "New user? Register here" : "Already have an account? Log in"}
                        </button>
                        <button onClick={() => setView("reset")}>Forgot Password?</button>
                    </>
                )}

                {view === "reset" && (
                    <button onClick={() => setView("login")}>⬅ Back to Login</button>
                )}
            </div>
        </div>
    );
};

export default WelcomePage;





