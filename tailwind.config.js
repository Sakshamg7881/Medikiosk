/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        pine: {
          50: '#F2F6F5',
          100: '#E1ECE8',
          200: '#C2D8D1',
          300: '#9EBFB6',
          400: '#649789',
          500: '#3D6F63',
          600: '#2A5248',
          700: '#1F3A34', // Primary brand color
          800: '#182C27',
          900: '#121F1C',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E5EBE6',
          200: '#CCD8CE',
          300: '#ADC2B1',
          400: '#8CAE91',
          500: '#6B8F71', // Secondary / Success
          600: '#547259',
          700: '#3F5643',
          800: '#2C3C2F',
          900: '#1B251D',
        },
        turmeric: {
          50: '#FDF8F3',
          100: '#F8EDE1',
          200: '#F1D9BF',
          300: '#E7BE97',
          400: '#DC9F6A',
          500: '#C97D3D', // Accent
          600: '#B06429',
          700: '#894B1E',
          800: '#643616',
          900: '#42240E',
        },
        parchment: {
          50: '#FCFBF9',
          100: '#FAF9F6', // Background
          200: '#F3F0EA',
          300: '#E8E3D8',
          400: '#D8D1C2',
          500: '#C5BCAB',
        },
        ink: {
          50: '#F6F6F5',
          100: '#E7E6E4',
          200: '#CECCC8',
          300: '#ADA9A3',
          400: '#7B7770',
          500: '#55514B',
          600: '#3D3934',
          700: '#2C2925',
          800: '#1C1B19', // Text color
          900: '#121110',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Hind', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
        handwriting: ['Caveat', 'cursive'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(28, 27, 25, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(28, 27, 25, 0.08), 0 1px 2px -1px rgba(28, 27, 25, 0.08)',
        md: '0 4px 6px -1px rgba(28, 27, 25, 0.08), 0 2px 4px -2px rgba(28, 27, 25, 0.06)',
      },
    },
  },
  plugins: [],
}
