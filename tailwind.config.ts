import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00E5A0',
        bg: '#0D0D0D',
        card: '#1A1A1A',
        border: '#2A2A2A',
        sub: '#888888',
      },
    },
  },
  plugins: [],
};

export default config;
