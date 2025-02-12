import React, { createContext, useState, useEffect } from "react";

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
    const registerUser = (newUsername, newPassword) => {
        if (users[newUsername]) return "User already exists!";
        setUsers(prevUsers => ({ ...prevUsers, [newUsername]: newPassword }));
        setUsername(newUsername);
        return "Registered successfully!";
    };

    // ✅ Log in an existing user
    const loginUser = (loginUsername, loginPassword) => {
        if (users[loginUsername] === loginPassword) {
            setUsername(loginUsername);
            return "Login successful!";
        } else {
            return "Invalid credentials.";
        }
    };

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
