module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0a5b',
        },
        surface: {
          DEFAULT: '#0b0b15',
          50: '#0f0f1d',
          100: '#111124',
          200: '#17172e',
          300: '#1e1e3a',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(168,85,247,0.15), 0 15px 30px -10px rgba(168,85,247,0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
