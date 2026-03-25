/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#020617', // slate-950
          panel: 'rgba(30, 41, 59, 0.5)', // slate-800/50
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
    },
  },
  plugins: [],
}