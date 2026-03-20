/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
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
        navy: '#0D1117',
        card: '#161D2A',
        run: '#F59E0B',
        strength: '#84CC16',
        other: '#A78BFA',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
