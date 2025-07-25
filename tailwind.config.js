module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#F9A826', // A vibrant, pencil-orange
        'secondary': '#4A5568', // A dark, graphite-gray for text
        'accent': '#E53E3E', // A friendly red for leave/cancel actions
        'background': '#F7FAFC', // A very light gray for the page background
        'surface': '#FFFFFF', // Clean white for cards
        'muted': '#A0AEC0', // A lighter gray for subtitles and borders
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'subtle': '0 2px 4px 0 rgba(0,0,0,0.05)',
        'DEFAULT': '0 4px 12px 0 rgba(0,0,0,0.08)',
        'lg': '0 10px 20px 0 rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 