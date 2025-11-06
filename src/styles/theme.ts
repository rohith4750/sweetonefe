// Color Palette - Based on Sweet Shop Design
export const theme = {
  colors: {
    primaryBg: '#F8F5F2', // Light beige background
    headerBg: '#6B4C5F', // Deep reddish-purple header
    textPrimary: '#5D3A2E', // Dark reddish-brown for headings
    textSecondary: '#4A4A4A', // Dark grey for body text
    textPrice: '#8B5A3C', // Warm brown for prices
    accentOrange: '#FF8C42', // Orange accent dots
    successGreen: '#25D366', // WhatsApp green for buttons
    white: '#FFFFFF',
    lightGrey: '#F5F5F5',
    borderColor: '#E0E0E0',
    errorRed: '#DC3545',
    warningYellow: '#FFC107',
    infoBlue: '#17A2B8',
  },
  typography: {
    fontPrimary: "'Poppins', sans-serif",
    fontSecondary: "'Poppins', sans-serif",
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },
  borderRadius: {
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px', // Full circle
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  layout: {
    headerHeight: '64px',
    sidebarWidth: '260px',
    sidebarCollapsedWidth: '80px',
  },
} as const;

export type Theme = typeof theme;

