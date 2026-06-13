/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chat: {
          bg: '#343541',
          sidebar: '#202123',
          input: '#40414f',
          bot: '#444654',
          border: '#565869',
        },
      },
    },
  },
  plugins: [],
};
