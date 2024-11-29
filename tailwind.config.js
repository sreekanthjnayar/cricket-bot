/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        messagePopup: {
          "0%": {
            transform: "scale(0.8) translateY(40px)",
            opacity: "0",
          },
          "25%": {
            transform: "scale(1.05) translateY(10px)",
            opacity: "0.9",
          },
          "50%": {
            transform: "scale(0.95) translateY(5px)",
            opacity: "0.95",
          },
          "75%": {
            transform: "scale(1.02) translateY(2px)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(1) translateY(0)",
            opacity: "1",
          },
        },
      },
      animation: {
        "message-popup":
          "messagePopup 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [],
};
