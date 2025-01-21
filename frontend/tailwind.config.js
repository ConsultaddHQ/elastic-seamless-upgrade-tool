/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope'],
      },
      colors: {
        customPurple: '#9D90BB',
        shine: "#6E687C",// Add your custom color here
        compGray: "#0D0D0D"
      }
    },
  },
  plugins: [],
}

