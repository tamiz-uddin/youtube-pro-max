import { AppTheme } from '../types';

export interface ThemeColors {
  background: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
  accentGlow: string;
  secondaryAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfaceSubtle: string;
  bottomBarBg: string;
  activeTabGlow: string;
  divider: string;
  badgeBg: string;
  success: string;
  warning: string;
  error: string;
}

export const themes: Record<AppTheme, ThemeColors> = {
  'oled-black': {
    background: '#07080B',
    cardBg: '#111319',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    accent: '#FF0033',
    accentGlow: 'rgba(255, 0, 51, 0.35)',
    secondaryAccent: '#8B5CF6',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    surface: '#171922',
    surfaceSubtle: '#1F222E',
    bottomBarBg: 'rgba(11, 13, 19, 0.95)',
    activeTabGlow: '#FF0033',
    divider: 'rgba(255, 255, 255, 0.07)',
    badgeBg: '#FF0033',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  'cyber-neon': {
    background: '#060713',
    cardBg: '#0F1123',
    cardBorder: 'rgba(0, 240, 255, 0.15)',
    accent: '#00F0FF',
    accentGlow: 'rgba(0, 240, 255, 0.4)',
    secondaryAccent: '#FF007A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B9C3E6',
    textMuted: '#61688B',
    surface: '#151833',
    surfaceSubtle: '#1C2042',
    bottomBarBg: 'rgba(6, 7, 19, 0.95)',
    activeTabGlow: '#00F0FF',
    divider: 'rgba(0, 240, 255, 0.1)',
    badgeBg: '#FF007A',
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF0055',
  },
  'pro-gold': {
    background: '#0B0907',
    cardBg: '#15120E',
    cardBorder: 'rgba(245, 158, 11, 0.2)',
    accent: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    secondaryAccent: '#E11D48',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2D9CF',
    textMuted: '#847B72',
    surface: '#1E1914',
    surfaceSubtle: '#29221C',
    bottomBarBg: 'rgba(11, 9, 7, 0.95)',
    activeTabGlow: '#F59E0B',
    divider: 'rgba(245, 158, 11, 0.12)',
    badgeBg: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};
