/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        emerald: {
          500: '#1D9E75',
          600: '#178460',
        },
        teal: {
          500: '#1D9E75',
          600: '#178460',
        }
      }
    },
  },
  plugins: [],
}
