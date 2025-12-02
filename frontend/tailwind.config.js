/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'park-blue': '#2563eb',
        'park-dark': '#1e293b',
      }
    },
  },
  plugins: [],
}
