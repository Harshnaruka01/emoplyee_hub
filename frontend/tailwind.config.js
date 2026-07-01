/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#4d70ff',
          600: '#2b47fc',
          700: '#1d30e8',
          800: '#1827bc',
          900: '#192694',
        },
        slate: {
          850: '#151f32',
          350: '#b2bed1',
        }
      }
    },
  },
  plugins: [],
}
