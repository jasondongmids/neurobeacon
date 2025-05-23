import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { UserStateProvider } from "./context/UserStateContext";
import { ModelProvider } from "./context/ModelContext";
import { UserStatisticsProvider } from "./context/UserStatisticsContext";
import { GameHxProvider } from "./context/GameHxContext";
import WelcomePage from "./components/WelcomePage";
import GamePage from "./components/GamePage";
import Dashboard from "./components/Dashboard";
import TestPage from "./components/TestPage";
import Redirection from "./components/Redirection";
import ScrollToTop from "./components/ScrollToTop";

function App() {
    return (
        <ThemeProvider>
        <UserProvider>
        <UserStateProvider>
        <UserStatisticsProvider>
        <GameHxProvider>
        <ModelProvider>
            <Router>
                <ScrollToTop />
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
        </GameHxProvider>
        </UserStatisticsProvider>
        </UserStateProvider>
        </UserProvider>
        </ThemeProvider>
    );
}

export default App;


