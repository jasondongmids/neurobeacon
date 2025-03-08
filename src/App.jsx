import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { UserStateProvider } from "./context/UserStateContext";
import { ModelProvider } from "./context/ModelContext";
import { UserStatisticsProvider } from "./context/UserStatisticsContext";
import WelcomePage from "./components/WelcomePage";
import GamePage from "./components/GamePage";
import Dashboard from "./components/Dashboard";
import TestPage from "./components/TestPage";
import Redirection from "./components/Redirection";

function App() {
    return (
        <UserProvider>
        <UserStateProvider>
        <UserStatisticsProvider>
        <ModelProvider>
            <Router>
                <Redirection>
                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/game/:gameType" element={<GamePage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/test" element={<TestPage />} />
                    </Routes>
                </Redirection>
            </Router>
        </ModelProvider>
        </UserStatisticsProvider>
        </UserStateProvider>
        </UserProvider>
    );
}

export default App;



