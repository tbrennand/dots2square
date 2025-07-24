module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFA500', // Orange from pencil
          dark: '#FF8C00',
        },
        secondary: {
          DEFAULT: '#6B7280', // Gray from background
          light: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#3B82F6', // Blue for buttons
          hover: '#2563EB',
        },
        background: '#F3F4F6', // Light gray
        text: '#1F2937', // Dark text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Modern font
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
} 