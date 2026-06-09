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
        sidebar: '#1e293b',
        card: '#1e293b',
        surface: '#0f172a',
      },
    },
  },
  plugins: [],
}
