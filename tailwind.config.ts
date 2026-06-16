import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        'container': '800px',
      },
      fontFamily: {
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        body: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', '"Courier New"', 'monospace'],
        // Backward-compat aliases. (Removed `heading` — it pointed at the body
        // sans despite its name; migrate to .type-card / explicit font-mono.)
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      colors: {
        // Arvo Bold palette
        'off-white': '#F7F7F5',
        'gray': {
          DEFAULT: '#D4D4D0',
          light: '#EFEFED',
          // #8A8A85 only hit ~3.3:1 against the cream page background --
          // below WCAG AA's 4.5:1 for body-size text. This shade clears it
          // on every background we set it over while keeping the warm hue.
          mid: '#6E6E69',
        },
        'ink': {
          DEFAULT: '#171717',
          light: '#2E2E2E',
        },
        'amber': {
          DEFAULT: '#D4740A',
          light: '#F2A91A',
          pale: '#FFF3E0',
          // #D4740A only reaches ~3.3:1 on white/cream — below WCAG AA's 4.5:1
          // for small text. This deeper shade clears AA for fine-print amber
          // text/links while keeping the warm brand hue. Use for small text
          // only; the brighter DEFAULT stays for fills, borders and large UI.
          deep: '#A85A00',
        },
        'red': {
          DEFAULT: '#C43D2E',
          pale: '#FDEAEA',
          // #C43D2E on red-pale is 4.47:1 — a hair under AA's 4.5:1 for the
          // small "HH"/status badges. This deeper red clears it (4.9:1) with a
          // near-imperceptible hue shift. Use on red-pale badges only.
          deep: '#BA3829',
        },
        'green': {
          DEFAULT: '#2D7A3D',
          pale: '#E8F5E9',
        },
        'blue': '#3B82F6',
        'purple': '#7C3AED',

        // shadcn/ui CSS variable colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
      },
      borderRadius: {
        pill: '9999px',
        card: '12px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        hard: '4px 4px 0 #171717',
        'hard-sm': '3px 3px 0 #171717',
        'hard-hover': '2px 2px 0 #171717',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        fadeIn: 'fadeIn 0.2s ease-out forwards',
      },
      borderWidth: {
        3: '3px',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
