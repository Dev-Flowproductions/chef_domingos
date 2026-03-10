/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',
        secondary: '#1D3557',
        background: '#F9FAFB',
        accent: '#F4A261',
      },
    },
  },
  plugins: [],
};
