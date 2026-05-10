/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: '#E8B4B8',
        cream: '#FDF6F0',
        gold: '#D4AF37',
        rose: '#B76E79',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 35px rgba(183, 110, 121, 0.12)',
        glow: '0 10px 40px rgba(212, 175, 55, 0.22)',
      },
      backgroundImage: {
        'blush-glow': 'radial-gradient(circle at 20% 25%, rgba(232, 180, 184, 0.45) 0, transparent 42%), radial-gradient(circle at 80% 0%, rgba(212, 175, 55, 0.16) 0, transparent 34%)',
      },
    },
  },
  plugins: [],
}
