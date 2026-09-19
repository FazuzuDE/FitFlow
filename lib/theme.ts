// Values from docs/DESIGN_SYSTEM.md. Native/system font is intentional.
export const colors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#F7F7F9',
  surface: '#FFFFFF',
  surfaceSubtle: '#F2F2F7',
  textPrimary: '#111111',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',
  separator: 'rgba(60,60,67,0.12)',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
} as const;
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  subheadline: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
} as const;
export const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
};
