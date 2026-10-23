// Classy minimal light palette: blue-tinted off-white, hairline borders, one restrained accent.
// Keep colour for meaning (state, errors) only; hierarchy comes from type and spacing.
export const colors = {
  // Off-white with a faint blue tint; cards sit on it in pure white
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F7',
  surfaceElevated: '#FFFFFF',

  // Primary actions are a soft slate blue with white text (lighter than black-navy)
  primary: '#3A5078',
  primaryContainer: '#2F4366',
  onPrimary: '#FFFFFF',

  // Single soft blue accent for small highlights (active state, step indicator)
  accent: '#4C6FA8',
  accentPurple: '#4C6FA8',
  accentPink: '#4C6FA8',
  accentAmber: '#4C6FA8',

  border: '#E8ECF1',
  borderGlow: '#D3DAE4',
  divider: '#EAEEF3',
  text: '#141B27',
  textSecondary: '#3E4859',
  // Dark enough to read comfortably on the off-white background
  textMuted: '#667085',
  error: '#C53030',
  success: '#2F855A',

  cardBackground: '#FFFFFF',
  cardBorder: '#E8ECF1',
  badgeHumor: '#4A5568',
  badgeBanter: '#4A5568',
  badgeSmooth: '#4A5568',

  // Chat bubbles
  bubbleOutgoing: '#3A5078',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#FFFFFF',
  onBubbleIncoming: '#141B27',

  // Dimmed backdrop behind dialogs and sheets
  scrim: 'rgba(20,27,39,0.32)',
} as const;

// Kept for existing LinearGradient call sites; flat pairs so nothing glows.
// Prefer plain backgroundColor in new code.
export const gradients = {
  primary: ['#3A5078', '#3A5078'] as const,
  outgoingBubble: ['#3A5078', '#3A5078'] as const,
  incomingBubble: ['#FFFFFF', '#FFFFFF'] as const,
  glassBorder: ['#E2E7EE', '#E2E7EE', '#E2E7EE'] as const,
};

// Nearly square corners: the look is flat, not bubbly
export const radius = {
  sm: 3,
  md: 5,
  lg: 6,
  xl: 8,
  pill: 999,
} as const;

// Compact rhythm: sections are separated by dividers, not big gaps
export const spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 22,
} as const;

export const type = {
  title: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.text },
  heading: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.1, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21, color: colors.text },
  label: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3, textTransform: 'uppercase' as const, color: colors.textMuted },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: colors.textSecondary },
} as const;
