/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
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
        'surface-container-highest': '#E6E0E9',
        outline: '#79747E',
        'outline-variant': '#CAC4D0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
