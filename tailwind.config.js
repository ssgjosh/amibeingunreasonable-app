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
        }
      },
      colors: { // Add a dummy color to force rebuild
        'dummy-color': '#123456',
      }
    },
  },
  plugins: [],
}