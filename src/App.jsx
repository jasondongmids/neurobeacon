import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { UserStateProvider } from "./context/UserStateContext";
import WelcomePage from "./components/WelcomePage";
import GamePage from "./components/GamePage";
import Dashboard from "./components/Dashboard";
import TestPage from "./components/TestPage";

function App() {
    return (
        <UserProvider>
            <UserStateProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/game" element={<GamePage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/test" element={<TestPage />} />
                    </Routes>
                </Router>
            </UserStateProvider>
        </UserProvider>
    );
}

export default App;



