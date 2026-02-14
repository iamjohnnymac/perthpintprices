import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'beer-gold': '#F4A100',
        'beer-amber': '#D97706',
        'beer-dark': '#1E1E1E',
      },
    },
  },
  plugins: [],
}
export default config