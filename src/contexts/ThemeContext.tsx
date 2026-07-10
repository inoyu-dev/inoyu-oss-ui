import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'unomi-ui-theme-preference';

// Load theme from localStorage synchronously (before React renders)
const loadThemeFromStorage = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.error('Error loading theme from storage:', error);
  }
  return 'system';
};

// Apply theme immediately (synchronously)
const applyTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('dark', 'light');
  
  let resolvedTheme: 'light' | 'dark';
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    resolvedTheme = prefersDark ? 'dark' : 'light';
  } else {
    resolvedTheme = theme;
  }
  
  root.classList.add(resolvedTheme);
  
  return resolvedTheme;
};

// Apply theme on module load (before React renders)
// This prevents flash of wrong theme
if (typeof window !== 'undefined') {
  const initialTheme = loadThemeFromStorage();
  applyTheme(initialTheme);
  
  // Also listen for system theme changes if theme is set to 'system'
  if (initialTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newTheme);
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return loadThemeFromStorage();
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return applyTheme(theme) || 'light';
  });

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
    
    // Apply theme immediately
    const resolved = applyTheme(newTheme);
    if (resolved) {
      setResolvedTheme(resolved);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
