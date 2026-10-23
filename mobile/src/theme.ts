// Flat, minimal palettes: hairline borders, one restrained accent, hierarchy from type and spacing.
// Every theme has the same keys; components read the active one through useStyles()/useColors().
import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from './state/ThemeContext';

export interface Palette {
  background: string;
  surface: string; // cards, dialogs, inputs
  surfaceVariant: string; // pressed rows, tracks, selected segment backgrounds
  surfaceElevated: string;
  primary: string; // filled buttons
  onPrimary: string;
  accent: string; // small highlights: active item, step label, focus
  border: string;
  borderGlow: string; // slightly stronger hairline for inputs and secondary buttons
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string; // dark enough to read on its background
  error: string;
  success: string;
  bubbleOutgoing: string;
  onBubbleOutgoing: string;
  bubbleIncoming: string;
  onBubbleIncoming: string;
  scrim: string; // dimmed backdrop behind dialogs and sheets
}

export type ThemeId = 'slate' | 'sand' | 'sage' | 'graphite' | 'midnight';

export interface Theme {
  id: ThemeId;
  name: string;
  dark: boolean;
  colors: Palette;
}

const slate: Palette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F7',
  surfaceElevated: '#FFFFFF',
  primary: '#3A5078',
  onPrimary: '#FFFFFF',
  accent: '#4C6FA8',
  border: '#E8ECF1',
  borderGlow: '#D3DAE4',
  divider: '#EAEEF3',
  text: '#141B27',
  textSecondary: '#3E4859',
  textMuted: '#667085',
  error: '#C53030',
  success: '#2F855A',
  bubbleOutgoing: '#3A5078',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#FFFFFF',
  onBubbleIncoming: '#141B27',
  scrim: 'rgba(20,27,39,0.32)',
};

const sand: Palette = {
  background: '#F7F4EF',
  surface: '#FFFFFF',
  surfaceVariant: '#EFEAE2',
  surfaceElevated: '#FFFFFF',
  primary: '#5B4636',
  onPrimary: '#FFFFFF',
  accent: '#9A7350',
  border: '#E9E3D9',
  borderGlow: '#D9D0C3',
  divider: '#ECE6DC',
  text: '#1F1A15',
  textSecondary: '#4A4239',
  textMuted: '#776D61',
  error: '#B83A2E',
  success: '#3F7A4A',
  bubbleOutgoing: '#5B4636',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#FFFFFF',
  onBubbleIncoming: '#1F1A15',
  scrim: 'rgba(31,26,21,0.32)',
};

const sage: Palette = {
  background: '#F3F6F4',
  surface: '#FFFFFF',
  surfaceVariant: '#E7EEEA',
  surfaceElevated: '#FFFFFF',
  primary: '#2F5D50',
  onPrimary: '#FFFFFF',
  accent: '#4F8573',
  border: '#E1E8E4',
  borderGlow: '#CFDAD4',
  divider: '#E5ECE8',
  text: '#14201C',
  textSecondary: '#3B4A45',
  textMuted: '#60706A',
  error: '#BD3B3B',
  success: '#2F7A50',
  bubbleOutgoing: '#2F5D50',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#FFFFFF',
  onBubbleIncoming: '#14201C',
  scrim: 'rgba(20,32,28,0.32)',
};

const graphite: Palette = {
  background: '#0F1115',
  surface: '#171A20',
  surfaceVariant: '#1F232B',
  surfaceElevated: '#1F232B',
  primary: '#C9D3E3',
  onPrimary: '#0F1115',
  accent: '#8EA6D1',
  border: '#262A33',
  borderGlow: '#343A46',
  divider: '#22262E',
  text: '#E7EAF0',
  textSecondary: '#B6BDC9',
  textMuted: '#8A93A1',
  error: '#F07178',
  success: '#5FBF7F',
  bubbleOutgoing: '#3A5078',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#1F232B',
  onBubbleIncoming: '#E7EAF0',
  scrim: 'rgba(0,0,0,0.55)',
};

const midnight: Palette = {
  background: '#0B1220',
  surface: '#111A2C',
  surfaceVariant: '#18233A',
  surfaceElevated: '#18233A',
  primary: '#7C9CF5',
  onPrimary: '#0B1220',
  accent: '#8FAEFF',
  border: '#1E2A42',
  borderGlow: '#2B3958',
  divider: '#1A2539',
  text: '#E6ECF8',
  textSecondary: '#B0BBD1',
  textMuted: '#8390AA',
  error: '#FF7A85',
  success: '#5CC98A',
  bubbleOutgoing: '#2C437A',
  onBubbleOutgoing: '#FFFFFF',
  bubbleIncoming: '#18233A',
  onBubbleIncoming: '#E6ECF8',
  scrim: 'rgba(0,0,0,0.6)',
};

export const THEMES: Theme[] = [
  { id: 'slate', name: 'Slate', dark: false, colors: slate },
  { id: 'sand', name: 'Sand', dark: false, colors: sand },
  { id: 'sage', name: 'Sage', dark: false, colors: sage },
  { id: 'graphite', name: 'Graphite', dark: true, colors: graphite },
  { id: 'midnight', name: 'Midnight', dark: true, colors: midnight },
];

export const DEFAULT_THEME_ID: ThemeId = 'slate';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

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

/** Text styles for a palette (they carry colour, so each theme gets its own) */
export function makeType(c: Palette) {
  return {
    title: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2, color: c.text },
    heading: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.1, color: c.text },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21, color: c.text },
    label: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3, textTransform: 'uppercase' as const, color: c.textMuted },
    caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: c.textSecondary },
  };
}

export type TypeScale = ReturnType<typeof makeType>;

/**
 * Themed replacement for a module-level StyleSheet.create:
 *   const useStyles = makeStyles((c, t) => ({ title: { ...t.title }, row: { borderColor: c.divider } }));
 *   // in the component: const styles = useStyles();
 * Styles are built once per theme and cached.
 */
export function makeStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (c: Palette, t: TypeScale) => T,
) {
  const cache = new Map<ThemeId, T>();
  return function useStyles(): T {
    const { theme } = useTheme();
    return useMemo(() => {
      let styles = cache.get(theme.id);
      if (!styles) {
        styles = StyleSheet.create(factory(theme.colors, makeType(theme.colors)));
        cache.set(theme.id, styles);
      }
      return styles;
    }, [theme]);
  };
}

/** The active palette, for colours used outside a stylesheet (icons, spinners, placeholderTextColor) */
export function useColors(): Palette {
  return useTheme().theme.colors;
}
