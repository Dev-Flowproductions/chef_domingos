// Design tokens extracted from Figma — Chef Domingos / Pizza Lab
export const Colors = {
  // Primary palette
  gold: '#BF994E',
  goldLight: '#D4B06A',
  goldBg: 'rgba(191, 153, 78, 0.12)',

  // Text
  textPrimary: '#666666',
  textDark: '#333333',
  white: '#FFFFFF',

  // Backgrounds
  background: '#F8F5F0',      // warm off-white used throughout
  backgroundOpacity: 'rgba(248, 245, 240, 0.95)',
  card: '#FFFFFF',

  // Borders
  border: '#BF994E',
  borderLight: '#E8E0D5',

  // Status / points
  pointsGain: '#BF994E',
  pointsLoss: '#848484',

  // Shadow
  shadow: 'rgba(0,0,0,0.15)',
};

export const Typography = {
  // Logo / brand font
  logoFamily: 'serif',          // Spectral Italic — fallback to serif
  logoSize: 59,
  logoSmallSize: 34,

  // Body font
  bodyFamily: 'System',         // Roboto — fallback to system
  heading: { fontSize: 34, fontWeight: '700' as const },
  subheading: { fontSize: 26, fontWeight: '400' as const },
  body: { fontSize: 18, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
  pointsBig: { fontSize: 44, fontWeight: '800' as const },
  pointsLabel: { fontSize: 18, fontWeight: '400' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  button: 22,
  card: 14,
  cardLg: 16,
  badge: 30,
};

// Background illustration asset (used as watermark on all screens)
export const Assets = {
  bgIllustration: require('../assets/bg-illustration.jpg'),
};
