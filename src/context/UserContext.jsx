import React, { createContext, useState, useEffect } from "react";
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignUp } from "aws-amplify/auth";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // ✅ Load stored user data and "Remember Me" preference
    const [username, setUsername] = useState(localStorage.getItem("currentUser") || "");
    const [users, setUsers] = useState(JSON.parse(localStorage.getItem("users")) || {});
    const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberMe") === "true");
    const [preferredName, setPreferredName] = useState("")

    // ✅ Save user data whenever it changes
    useEffect(() => {
        localStorage.setItem("users", JSON.stringify(users));
    }, [users]);

    // ✅ Manage "Remember Me" functionality
    useEffect(() => {
        if (username) {
            if (rememberMe) {
                localStorage.setItem("currentUser", username);
            } else {
                sessionStorage.setItem("currentUser", username);
                localStorage.removeItem("currentUser"); // Clear persistent login if not remembered
            }
        } else {
            localStorage.removeItem("currentUser");
            sessionStorage.removeItem("currentUser");
        }
    }, [username, rememberMe]);

    // ✅ Register a new user
    const registerUser = async (newUsername, newPassword) => {
        try {
            const response = await signUp({
                username: newUsername,
                password: newPassword,
            });
            console.log("Register response:", response)
            console.log("Next Step:", response.nextStep.signUpStep) // signUpStep = 'CONFIRM_SIGN_UP'
            setUsername(newUsername); // user_id is generated in response.userId
            return "Registered successfully!" // Need to update for user to verify password or we auto-confirm user
        } catch (error) {
            console.log("User signup failed:", error)
            return error.message
        }
    }

    // ✅ Confirm a verification token
    const completeSignUp = async (username, verificationCode) => {
        try {
            const response = await confirmSignUp({
                username: username,
                confirmationCode: verificationCode
            });
            console.log("Confirmation response:", response)

            if (response.isSignUpComplete) {
                return "CONFIRMED"
            } else {
                return "INVALID"
            }
        } catch (error) {
            console.log("Confirmation failed:", error)
            return error.message
        }
    }

    // ✅ Log in an existing user
    const loginUser = async (loginUsername, loginPassword) => {
        try {
            // await signOut()

            const response = await signIn({
                username: loginUsername,
                password: loginPassword,
            });
            return response.nextStep.signInStep
        } catch (error) {
            console.log("Login error:", error)
            return error.message
        }
    }

    const logoutUser = async () => {
        try {
            await signOut()
            console.log("User logged out")
        } catch (error) {
            console.log("Logout error:", error)
            return error.message
        }
    }

    // ✅ Reset a user's password
    const resetPassword = (loginUsername, newPassword) => {
        if (!users[loginUsername]) return "User not found.";
        setUsers(prevUsers => ({ ...prevUsers, [loginUsername]: newPassword }));
        return "Password reset successfully!";
    };

    const checkAuth = async () => {
        try {
            const user = await getCurrentUser();
            const user2 = await fetchAuthSession();
            console.log("Current user", user)
            console.log("Current user2", user2)

            if (user) {
                setUsername(user.signInDetails?.loginId)
                return true;
            } 

            return false;
        } catch (error) {
            console.log("User not signed in");
            return false;
        }
    };

    return (
        <UserContext.Provider value={{ 
            username, 
            setUsername, 
            registerUser,
            completeSignUp, 
            loginUser, 
            logoutUser,
            checkAuth,
            resetPassword, 
            rememberMe, 
            setRememberMe 
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
