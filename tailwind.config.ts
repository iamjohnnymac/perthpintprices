import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  keyframes: {
  			'slide-up': {
  				'0%': { transform: 'translateY(100%)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' },
  			},
  		},
  		animation: {
  			'slide-up': 'slide-up 0.4s ease-out',
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'26': '6.5rem',
  			'30': '7.5rem',
  		},
  		fontSize: {
  			'display': ['3rem', { lineHeight: '3.25rem', fontWeight: '700' }],
  			'title': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '600' }],
  			'subtitle': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '400' }],
  			'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
  		},
  		maxWidth: {
  			'app': '1120px',
  		},
  		fontFamily: {
  			heading: ['var(--font-space-grotesk)', 'sans-serif'],
  			mono: ['var(--font-jetbrains-mono)', 'monospace'],
  		},
  		colors: {
  			// Arvo warm orange palette
  			'amber': '#E8792B',
  			'amber-light': '#F2A05C',
  			'amber-dark': '#D06820',
  			'charcoal': '#1A1A1A',
  			'cream': '#FAF7F2',
  			'cream-dark': '#F0EBE1',
  			'stone-warm': '#A8A29E',
  			'beer-gold': '#E8792B',
  			'beer-amber': '#D06820',
  			'beer-dark': '#1A1A1A',
  			'gold': '#E8792B',
			// Price label colors
			'bargain': '#22C55E',
			'fair': '#F59E0B',
			'pricey': '#EF4444',
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
