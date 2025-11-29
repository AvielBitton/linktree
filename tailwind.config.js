/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'link-dark': 'rgba(38, 38, 38, 0.8)',
        'link-hover': 'rgba(50, 50, 50, 0.9)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

