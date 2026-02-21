/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'SF Pro Text', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: '#0A84FF',
        'accent-emerald': '#30D158',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
