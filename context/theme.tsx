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
  warm: string;
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
  bg: '#FAFBFA',
  bgSecondary: '#F1F5F3',
  bgCard: '#FFFFFF',
  border: '#E2E8E5',
  borderSubtle: '#EEF2F0',
  text: '#0F1B17',
  textSecondary: '#2F433B',
  textMuted: '#5B6F66',
  textDim: '#6B7F76',
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#047857',
  accent: '#10B981',
  warm: '#D97706',
  card: '#FFFFFF',
  tabBg: '#FFFFFF',
  tabBorder: '#E2E8E5',
  tabActive: '#047857',
  tabInactive: '#8A9A93',
  inputBg: '#F1F5F3',
  inputBorder: '#E2E8E5',
  inputText: '#0F1B17',
  inputPlaceholder: '#8A9A93',
  statusPillBg: '#D1FAE5',
  statusPillText: '#065F46',
};

// "Backstage": near-black neutral surfaces, mint for brand/live, amber for warm highlights
export const darkColors: ThemeColors = {
  isDark: true,
  bg: '#0B0D0E',
  bgSecondary: '#111517',
  bgCard: '#171C1F',
  border: '#242B2F',
  borderSubtle: '#1B2125',
  text: '#F4F7F6',
  textSecondary: '#C9D3CF',
  textMuted: '#93A39D',
  textDim: '#7E908A',
  primary: '#10B981',
  primaryLight: '#12332A',
  primaryDark: '#34D399',
  accent: '#34D399',
  warm: '#F5A524',
  card: '#171C1F',
  tabBg: '#0F1214',
  tabBorder: '#1F2629',
  tabActive: '#34D399',
  tabInactive: '#7E908A',
  inputBg: '#111517',
  inputBorder: '#242B2F',
  inputText: '#F4F7F6',
  inputPlaceholder: '#5E706A',
  statusPillBg: '#12332A',
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
  themeMode: 'dark',
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDark: true,
  colors: darkColors,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

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
