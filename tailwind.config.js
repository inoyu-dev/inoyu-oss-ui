/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
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
  				foreground: 'hsl(var(--secondary-foreground))',
  				light: 'hsl(var(--secondary-light))',
  				dark: 'hsl(var(--secondary-dark))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))',
  				light: 'hsl(var(--muted-light))',
  				dark: 'hsl(var(--muted-dark))',
  				text: 'hsl(var(--muted-text))',
  				'text-light': 'hsl(var(--muted-text-light))',
  				'text-dark': 'hsl(var(--muted-text-dark))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  				light: 'hsl(var(--accent-light))',
  				dark: 'hsl(var(--accent-dark))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				light: 'hsl(var(--destructive-light))',
  				lighter: 'hsl(var(--destructive-lighter))',
  				dark: 'hsl(var(--destructive-dark))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  				light: 'hsl(var(--success-light))',
  				lighter: 'hsl(var(--success-lighter))',
  				dark: 'hsl(var(--success-dark))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  				light: 'hsl(var(--warning-light))',
  				lighter: 'hsl(var(--warning-lighter))',
  				dark: 'hsl(var(--warning-dark))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))',
  				light: 'hsl(var(--info-light))',
  				lighter: 'hsl(var(--info-lighter))',
  				dark: 'hsl(var(--info-dark))'
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
  			sidebar: {
  				bg: 'hsl(var(--sidebar-bg))',
  				text: 'hsl(var(--sidebar-text))',
  				'muted': 'hsl(var(--sidebar-text-muted))',
  				'hover': 'hsl(var(--sidebar-hover))',
  				'active': 'hsl(var(--sidebar-active))',
  				border: 'hsl(var(--sidebar-border))',
  				'border-strong': 'hsl(var(--sidebar-border-strong))',
  				'icon-bg': 'hsl(var(--sidebar-icon-bg))',
  				'icon-bg-hover': 'hsl(var(--sidebar-icon-bg-hover))'
  			}
  		},
  		boxShadow: {
  			'sm': 'var(--shadow-sm)',
  			'md': 'var(--shadow-md)',
  			'lg': 'var(--shadow-lg)',
  			'xl': 'var(--shadow-xl)',
  			'sidebar': 'var(--shadow-sidebar)',
  			'glow-white': 'var(--shadow-glow-white)',
  			'drop-text': 'var(--shadow-drop-text)',
  			'drop-element': 'var(--shadow-drop-element)'
  		},
  		transitionTimingFunction: {
  			'bounce': 'var(--easing-bounce)',
  			'smooth': 'var(--easing-smooth)'
  		},
  		transitionDuration: {
  			'base': '300ms',
  			'fast': '150ms',
  			'slow': '500ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

