/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/web/frontend/index.html",
    "./src/web/frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          dark: '#23272A',
          'not-quite-black': '#2C2F33',
          'actually-not-black': '#99AAB5',
        },
      },
    },
  },
  plugins: [],
}
