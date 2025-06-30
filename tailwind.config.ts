
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(214 84% 40%)',
					foreground: 'hsl(0 0% 98%)',
					50: 'hsl(214 100% 97%)',
					100: 'hsl(214 95% 93%)',
					200: 'hsl(213 97% 87%)',
					300: 'hsl(212 96% 78%)',
					400: 'hsl(213 94% 68%)',
					500: 'hsl(217 91% 60%)',
					600: 'hsl(221 83% 53%)',
					700: 'hsl(224 76% 48%)',
					800: 'hsl(226 71% 40%)',
					900: 'hsl(224 64% 33%)',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: {
					DEFAULT: 'hsl(142 76% 36%)',
					foreground: 'hsl(0 0% 98%)',
					50: 'hsl(138 76% 97%)',
					100: 'hsl(141 84% 93%)',
					200: 'hsl(141 79% 85%)',
					300: 'hsl(142 77% 73%)',
					400: 'hsl(142 69% 58%)',
					500: 'hsl(142 71% 45%)',
					600: 'hsl(142 76% 36%)',
					700: 'hsl(142 72% 29%)',
					800: 'hsl(143 64% 24%)',
					900: 'hsl(144 61% 20%)',
				},
				warning: {
					DEFAULT: 'hsl(38 92% 50%)',
					foreground: 'hsl(0 0% 98%)',
					50: 'hsl(54 91% 95%)',
					100: 'hsl(54 96% 88%)',
					200: 'hsl(53 98% 77%)',
					300: 'hsl(50 98% 64%)',
					400: 'hsl(44 96% 51%)',
					500: 'hsl(38 92% 50%)',
					600: 'hsl(32 95% 44%)',
					700: 'hsl(26 90% 37%)',
					800: 'hsl(23 83% 31%)',
					900: 'hsl(22 78% 26%)',
				},
				destructive: {
					DEFAULT: 'hsl(0 84% 60%)',
					foreground: 'hsl(0 0% 98%)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(224 76% 48%) 100%)',
				'gradient-success': 'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(142 76% 36%) 100%)',
				'gradient-warning': 'linear-gradient(135deg, hsl(44 96% 51%) 0%, hsl(32 95% 44%) 100%)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
