"use client"

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme variables for light and dark modes
const lightTheme = {
    '--chat-bg': '#f0f2f5',
    '--message-bg': '#ffffff',
    '--header-bg': '#00a884',
    '--recent-header-bg': '#ffffff',
    '--recent-header-text': '#111b21',
    '--active-chat-bg': '#e9edef',
    '--hover-bg': '#f5f6f6',
    '--border-color': '#e9edef',
    '--message-text': '#111b21',
    '--message-text-secondary': '#667781',
    '--header-text': '#ffffff',
    '--own-message-bg': '#00a884',
    '--own-message-text': '#ffffff',
};

const darkTheme = {
    '--chat-bg': '#111b21',
    '--message-bg': '#222e35',
    '--header-bg': '#202c33',
    '--recent-header-bg': '#202c33',
    '--recent-header-text': '#e9edef',
    '--active-chat-bg': '#2a3942',
    '--hover-bg': '#202c33',
    '--border-color': '#313d45',
    '--message-text': '#e9edef',
    '--message-text-secondary': '#8696a0',
    '--header-text': '#e9edef',
    '--own-message-bg': '#005c4b',
    '--own-message-text': '#e9edef',
};

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Apply theme variables to root element
    const applyTheme = (isDark) => {
        const theme = isDark ? darkTheme : lightTheme;
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    };

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            applyTheme(true);
        } else {
            applyTheme(false);
        }
    }, []);

    // Toggle theme function
    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newTheme = !prev;
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
            applyTheme(newTheme);
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 