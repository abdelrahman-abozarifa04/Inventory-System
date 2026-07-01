import { createContext, useState, useEffect, useCallback } from "react";

export const ThemeContext = createContext();

const STORAGE_KEY = "dental_clinic_theme";

/**
 * ThemeProvider
 * Manages light/dark mode state and persists preference.
 * Toggles the .dark class on <html> for CSS variable overrides.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  });

  // Sync .dark class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable — silent fail
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
