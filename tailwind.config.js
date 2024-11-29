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
        neon: {
          green: "#BBFDAB",
          blue: "#A1E3ED",
          teal: "#0FA8AB",
          dark: "#011012",
          deep: "#035F6E",
        },
      },

      boxShadow: {
        "neon-green": "0 0 6px rgba(187, 253, 171, 0.3)",
        "neon-teal": "0 0 6px rgba(15, 168, 171, 0.3)",
      },
    },
  },
  plugins: [],
};
