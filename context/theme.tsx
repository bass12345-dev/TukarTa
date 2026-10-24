import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  bgSecondary: string;
  bgCard: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  card: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  statusPillBg: string;
  statusPillText: string;
}

export const lightColors: ThemeColors = {
  isDark: false,
  bg: '#FFFFFF',
  bgSecondary: '#F0FDF4',
  bgCard: '#FFFFFF',
  border: '#D1FAE5',
  borderSubtle: '#F0FDF4',
  text: '#166534',
  textSecondary: '#065F46',
  textMuted: '#059669',
  textDim: '#10B981',
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#064E3B',
  accent: '#10B981',
  card: '#FFFFFF',
  tabBg: '#FFFFFF',
  tabBorder: '#D1FAE5',
  tabActive: '#166534',
  tabInactive: '#9CA3AF',
  inputBg: '#F0FDF4',
  inputBorder: '#D1FAE5',
  inputText: '#166534',
  inputPlaceholder: '#6EE7B7',
  statusPillBg: '#D1FAE5',
  statusPillText: '#065F46',
};

export const darkColors: ThemeColors = {
  isDark: true,
  bg: '#0A1612',
  bgSecondary: '#0E1F1A',
  bgCard: '#132821',
  border: '#1F3F34',
  borderSubtle: '#162F27',
  text: '#F0FDF4',
  textSecondary: '#D1FAE5',
  textMuted: '#A7F3D0',
  textDim: '#6EE7B7',
  primary: '#10B981',
  primaryLight: '#16382C',
  primaryDark: '#047857',
  accent: '#34D399',
  card: '#132821',
  tabBg: '#0D1D18',
  tabBorder: '#1A382E',
  tabActive: '#34D399',
  tabInactive: '#6EE7B7',
  inputBg: '#0E1F1A',
  inputBorder: '#1F3F34',
  inputText: '#F0FDF4',
  inputPlaceholder: '#4B7B6B',
  statusPillBg: '#18382C',
  statusPillText: '#A7F3D0',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

const THEME_STORAGE_KEY = '@tukarta_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDark: false,
  colors: lightColors,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load persisted theme
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setThemeModeState(savedMode as ThemeMode);
        }
      })
      .catch((err) => console.log('Error loading theme:', err));
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((err) =>
      console.log('Error saving theme:', err)
    );
  };

  const isDark =
    themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const toggleTheme = () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
