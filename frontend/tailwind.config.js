/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "rgba(1, 31, 75, 1)",
          medium: "rgba(3, 57, 108, 1)",
          light: "rgba(0, 91, 150, 1)",
          pale: "rgba(179, 205, 224, 1)",
        },
      },
    },
  },
  plugins: [],
};
