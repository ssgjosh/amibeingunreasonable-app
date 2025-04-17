/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-xy': 'gradient-xy 18s ease infinite',
        'gradient-bg': 'gradient-background 25s ease infinite',
        'pulse-bar': 'pulse-bar 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s ease-in-out infinite',
        'pulse-slow': 'pulse-bar 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'border-gradient': 'border-gradient 6s linear infinite', // Added border animation
      },
      keyframes: {
        'fadeIn': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'gradient-xy': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'gradient-background': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'pulse-bar': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        // Added keyframes for border gradient rotation
        'border-gradient': {
          '0%': { 'border-image-source': 'linear-gradient(0deg, theme(colors.primary.DEFAULT), theme(colors.accent), theme(colors.primary.hover))' },
          '25%': { 'border-image-source': 'linear-gradient(90deg, theme(colors.primary.DEFAULT), theme(colors.accent), theme(colors.primary.hover))' },
          '50%': { 'border-image-source': 'linear-gradient(180deg, theme(colors.primary.DEFAULT), theme(colors.accent), theme(colors.primary.hover))' },
          '75%': { 'border-image-source': 'linear-gradient(270deg, theme(colors.primary.DEFAULT), theme(colors.accent), theme(colors.primary.hover))' },
          '100%': { 'border-image-source': 'linear-gradient(360deg, theme(colors.primary.DEFAULT), theme(colors.accent), theme(colors.primary.hover))' },
        }
      },
      colors: {
        background: '#0D1117',        // Deep blue-black
        foreground: '#E6EDF3',        // Off-white (high contrast)
        primary: {
          DEFAULT: '#388BFD',        // Vibrant blue
          hover: '#58A6FF',          // Lighter blue for hover
        },
        secondary: {
          DEFAULT: '#161B22',        // Slightly lighter dark blue/grey
          foreground: '#8D96A0',      // Light blue-tinted grey (muted text)
        },
        border: '#30363D',           // Subtle grey border
        accent: '#5EEAD4',           // Teal/cyan accent
        success: '#238636',
        danger: '#DA3633',
        warning: '#DBAB0A',
      }
    },
  },
  plugins: [],
}