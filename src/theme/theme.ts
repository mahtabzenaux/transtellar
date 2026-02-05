export const COLORS = {
    background: '#0A0A0A', // Deep Obsidian
    surface: '#121212',    // Graphite
    surfaceLight: '#1A1A1A',
    primary: '#E6C200',    // Platinum Gold
    secondary: '#8B0000',  // Crimson
    accent: '#4B0082',    // Deep Purple
    text: '#F5F5F5',       // High contrast white
    textSecondary: '#A0A0A0', // Muted silver
    border: 'rgba(255, 255, 255, 0.1)',
    error: '#FF3B30',
    success: '#34C759',
    glass: 'rgba(18, 18, 18, 0.8)',
};

export const SPACING = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    huge: 64,
};

export const RADIUS = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const TYPOGRAPHY = {
    fonts: {
        primary: 'Ariel-Regular',
        heading: 'Ariel-Regular',
    },
    h1: {
        fontFamily: 'Ariel-Regular',
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700',
        letterSpacing: -1,
    },
    h2: {
        fontFamily: 'Ariel-Regular',
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    h3: {
        fontFamily: 'Ariel-Regular',
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '500',
    },
    body: {
        fontFamily: 'Ariel-Regular',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
    },
    bodySmall: {
        fontFamily: 'Ariel-Regular',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
    caption: {
        fontFamily: 'Ariel-Regular',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
};

export const ANIMATION = {
    fast: 200,
    standard: 300,
    slow: 500,
};

export const THEME = {
    colors: COLORS,
    spacing: SPACING,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    animation: ANIMATION,
};
