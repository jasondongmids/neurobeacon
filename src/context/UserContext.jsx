import React, { createContext, useState, useEffect } from "react";
import { signUp, signIn, signOut } from "aws-amplify/auth"

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // ✅ Load stored user data and "Remember Me" preference
    const [username, setUsername] = useState(localStorage.getItem("currentUser") || "");
    const [users, setUsers] = useState(JSON.parse(localStorage.getItem("users")) || {});
    const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberMe") === "true");

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
    // const registerUser = (newUsername, newPassword) => {
    //     if (users[newUsername]) return "User already exists!";
    //     setUsers(prevUsers => ({ ...prevUsers, [newUsername]: newPassword }));
    //     setUsername(newUsername);
    //     return "Registered successfully!";
    // };

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
            // setAuthError(error.message);
            return error.message
        }
    }

    // ✅ Log in an existing user
    // const loginUser = (loginUsername, loginPassword) => {
    //     if (users[loginUsername] === loginPassword) {
    //         setUsername(loginUsername);
    //         return "Login successful!";
    //     } else {
    //         return "Invalid credentials.";
    //     }
    // };

    const loginUser = async (loginUsername, loginPassword) => {
        try {
            await signOut() // ensure signout while testing

            const response = await signIn({
                username: loginUsername,
                password: loginPassword,
            });
            return response.nextStep.signInStep // 'DONE' == successful; "CONFIRM_SIGN_UP" = user needs to complete email verify
        } catch (error) {
            console.log("Login error:", error)
            return error.message
        }
    }

    // ✅ Reset a user's password
    const resetPassword = (loginUsername, newPassword) => {
        if (!users[loginUsername]) return "User not found.";
        setUsers(prevUsers => ({ ...prevUsers, [loginUsername]: newPassword }));
        return "Password reset successfully!";
    };

    return (
        <UserContext.Provider value={{ 
            username, 
            setUsername, 
            registerUser, 
            loginUser, 
            resetPassword, 
            rememberMe, 
            setRememberMe 
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
