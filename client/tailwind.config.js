/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          red: '#FF0033',
          'red-dark': '#CC0000',
          // Light theme
          'light-bg': '#FFFFFF',
          'light-text': '#0F0F0F',
          'light-secondary': '#606060',
          'light-hover': '#F2F2F2',
          'light-border': '#E5E5E5',
          'light-chip': '#F2F2F2',
          // Dark theme
          'dark-bg': '#0F0F0F',
          'dark-text': '#F1F1F1',
          'dark-secondary': '#AAAAAA',
          'dark-surface': '#212121',
          'dark-hover': '#272727',
          'dark-border': '#303030',
          'dark-chip': '#272727'
        }
      },
      fontFamily: {
        sans: [
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Arial',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
