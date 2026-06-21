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
        primary: {
          50: '#f0f7f1',
          100: '#dbece0',
          200: '#b9d9c2',
          300: '#8cbf9a',
          400: '#5c9f6d',
          500: '#1A6B30',
          600: '#135224',
          700: '#10421e',
          800: '#0e3519',
          900: '#0c2d16',
          DEFAULT: '#1A6B30',
          hover: '#155826',
        },
        'bg-main': '#F8FAF8',
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
