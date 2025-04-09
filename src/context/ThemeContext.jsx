// src/context/ThemeContext.jsx
import React, { createContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getSystemPreference = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : getSystemPreference();
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDark));
    document.body.classList.toggle("dark-mode", isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
