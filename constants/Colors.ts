export const MINT_THEME = {
  mint50: '#F0FDF4',
  mint100: '#D1FAE5',
  mint200: '#A7F3D0',
  mint500: '#10B981',
  mint600: '#059669',
  mint700: '#047857',
  mint800: '#065F46',
  mint900: '#166534',
  mint950: '#064E3B',
  bg: '#FFFFFF',
  bgSoft: '#F0FDF4',
  surface: '#FFFFFF',
  border: '#D1FAE5',
  borderSubtle: '#F0FDF4',
  text: '#166534',
  textMuted: '#10B981',
  textDim: '#6EE7B7',
  amber500: '#F59E0B',
  red500: '#EF4444',
};

const tintColorLight = '#10B981';
const tintColorDark = '#10B981';

export default {
  light: {
    text: '#166534',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#D1FAE5',
    tabIconSelected: '#166534',
  },
  dark: {
    text: '#166534',
    background: '#F0FDF4',
    tint: tintColorDark,
    tabIconDefault: '#A7F3D0',
    tabIconSelected: '#166534',
  },
  mint: MINT_THEME,
};
