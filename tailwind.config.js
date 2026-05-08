/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        // Body por defecto: Hanken Grotesk (cálido, moderno, ideal con Fraunces)
        // font-inter ahora apunta a Hanken para que toda la app use la nueva tipografía
        // sin tener que migrar 200+ archivos manualmente.
        inter: ['"Hanken Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        hanken: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', '"Plus Jakarta Sans"', 'serif'],
      },
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
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        peyu: {
          green: '#0F8B6C',
          arena: '#E7D8C6',
          gray: '#4B4F54',
          terracota: '#D96B4D',
          'light-green': '#A7D9C9',
        },
        ld: {
          bg: 'var(--ld-bg)',
          'bg-soft': 'var(--ld-bg-soft)',
          'bg-elevated': 'var(--ld-bg-elevated)',
          fg: 'var(--ld-fg)',
          'fg-soft': 'var(--ld-fg-soft)',
          'fg-muted': 'var(--ld-fg-muted)',
          'fg-subtle': 'var(--ld-fg-subtle)',
          action: 'var(--ld-action)',
          'action-hover': 'var(--ld-action-hover)',
          'action-soft': 'var(--ld-action-soft)',
          highlight: 'var(--ld-highlight)',
          'highlight-soft': 'var(--ld-highlight-soft)',
          border: 'var(--ld-border)',
          'border-strong': 'var(--ld-border-strong)',
          glass: 'var(--ld-glass)',
        }
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'bg-peyu-green', 'bg-peyu-arena', 'bg-peyu-gray', 'bg-peyu-terracota', 'bg-peyu-light-green',
    'text-peyu-green', 'text-peyu-terracota', 'text-peyu-gray',
    'border-peyu-green', 'border-peyu-terracota',
    'ld-canvas', 'ld-glass', 'ld-glass-soft', 'ld-glass-strong',
    'ld-btn-primary', 'ld-btn-ghost', 'ld-card', 'ld-input',
    'ld-display', 'ld-display-italic', 'ld-highlight', 'ld-highlight-bg',
    'bg-ld-bg', 'bg-ld-bg-soft', 'bg-ld-bg-elevated',
    'text-ld-fg', 'text-ld-fg-muted', 'text-ld-fg-soft', 'text-ld-action', 'text-ld-highlight',
    'border-ld-border', 'border-ld-action',
  ]
}
