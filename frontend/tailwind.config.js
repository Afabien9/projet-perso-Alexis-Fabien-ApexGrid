/** @type {import('tailwindcss').Config} */
export default {
  content: [
"./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1Red: '#e10600',
        f1Dark: '#15151e',
        f1Silver: '#949498',
      },
      fontFamily: {
        // Optionnel : si tu installes une police racing plus tard
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}