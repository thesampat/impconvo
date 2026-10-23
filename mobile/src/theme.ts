// Ported from android/app/.../ui/theme/Color.kt (glassmorphic dark palette)
export const colors = {
  background: '#0D0D12',
  surface: '#161622',
  surfaceVariant: '#202030',
  surfaceElevated: '#28283E',

  primary: '#38BDF8',
  primaryContainer: '#0284C7',
  onPrimary: '#FFFFFF',

  accentPurple: '#9E7AFF',
  accentPink: '#F472B6',
  accentAmber: '#FBBF24',

  border: '#28283D',
  borderGlow: '#3F3F5E',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  error: '#FB7185',
  success: '#34D399',

  cardBackground: '#1E1E2C',
  cardBorder: '#33334A',
  badgeHumor: '#E879F9',
  badgeBanter: '#F472B6',
  badgeSmooth: '#38BDF8',
} as const;

// Gradients as colour arrays for expo-linear-gradient
export const gradients = {
  primary: ['#38BDF8', '#9E7AFF'] as const,
  outgoingBubble: ['#6366F1', '#A855F7'] as const,
  incomingBubble: ['#1E1E2A', '#181822'] as const,
  glassBorder: ['rgba(56,189,248,0.5)', 'rgba(158,122,255,0.2)', '#28283D'] as const,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
