import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'library74.theme';

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const normalizeThemeMode = (value: string | null): ThemeMode => {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    normalizeThemeMode(localStorage.getItem(STORAGE_KEY))
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    themeMode === 'system' ? getSystemTheme() : themeMode
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      const nextTheme = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode;
      setResolvedTheme(nextTheme);
      applyTheme(nextTheme);
      localStorage.setItem(STORAGE_KEY, themeMode);
    };

    syncTheme();
    media.addEventListener('change', syncTheme);

    return () => media.removeEventListener('change', syncTheme);
  }, [themeMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    themeMode,
    resolvedTheme,
    setThemeMode: setThemeModeState,
  }), [themeMode, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
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
