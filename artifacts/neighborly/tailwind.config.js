/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#6750A4',
        'on-primary': '#FFFFFF',
        secondary: '#625B71',
        'on-secondary': '#FFFFFF',
        error: '#B3261E',
        'on-error': '#FFFFFF',
        surface: '#FEF7FF',
        'on-surface': '#1D1B20',
        'surface-container': '#F3EDF7',
        'surface-container-low': '#F7F2FA',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-high': '#ECE6F0',
        'surface-container-highest': '#E6E0E9',
        'surface-variant': '#E7E0EB',
        'on-surface-variant': '#49454F',
        outline: '#79747E',
        'outline-variant': '#CAC4D0',
        'error-container': '#F9DEDC',
        'on-error-container': '#410E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
