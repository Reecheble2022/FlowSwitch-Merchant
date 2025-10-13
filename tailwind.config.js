/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fs: {
          gradientStart: '#00D66B',
          gradientEnd: '#00C2FF',
          accent: '#1F6FEB',
          text: '#0F172A',
          textDark: '#F8FAFC',
          bg: '#F7F9FC',
          bgDark: '#0A0F1C',
        },
        brand: {
          green: '#00D66B',
          cyan: '#00C2FF',
          accent: '#1F6FEB',
        },
        success: '#00D66B',
        warning: '#FBBF24',
        error: '#EF4444',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #00D66B 0%, #00C2FF 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #00C257 0%, #00AEE6 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, rgba(0, 214, 107, 0.8) 0%, rgba(0, 194, 255, 0.8) 100%)',
        'hero-overlay': 'linear-gradient(to right, rgba(0, 214, 107, 0.85), rgba(0, 194, 255, 0.85))',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(0, 214, 107, 0.2)',
        'glow-cyan': '0 0 20px rgba(0, 194, 255, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '150': '150ms',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
};
