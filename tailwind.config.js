/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 和風カラーパレット
        primary: {
          DEFAULT: '#8B4513', // 茶色（土佐の土）
          dark: '#654321',
        },
        secondary: {
          DEFAULT: '#DC143C', // 深紅（勤王）
          dark: '#A0111F',
        },
        accent: {
          DEFAULT: '#FFD700', // 金色
          dark: '#FFA500',
        },
      },
      fontFamily: {
        // 和風フォント（将来的に追加）
        japanese: ['Noto Serif JP', 'serif'],
      },
    },
  },
  plugins: [],
}
