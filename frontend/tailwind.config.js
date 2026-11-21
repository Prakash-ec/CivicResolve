/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CivicLens-inspired Deep Navy Primary
        brand: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#829AB1',
          400: '#1C4D8D', // Royal Blue
          500: '#0F2854', // Deep Municipal Navy (CivicLens Primary)
          600: '#0A1C3B',
          700: '#07152B',
          800: '#050E1E',
          900: '#020710',
        },
        navy: {
          950: '#070F1E',
          900: '#0B132B',
          800: '#1C2A4A',
          700: '#1F3A60',
          DEFAULT: '#0F2854',
        },
        // CivicLens-inspired Vibrant Saffron Orange for Action/CTAs
        accent: {
          light: '#FB923C',
          DEFAULT: '#F97316', // Vibrant Saffron Orange
          dark: '#EA580C',
          hover: '#C2410C',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC', // Slate 50
          muted: '#F1F5F9', // Slate 100
          border: '#E2E8F0', // Slate 200
        },
        civic: {
          dark: '#0F172A',
          muted: '#64748B',
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#F59E0B',
          low: '#10B981',
          resolved: '#10B981',
          progress: '#3B82F6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,40,84,0.06), 0 1px 2px rgba(15,40,84,0.04)',
        'card-hover': '0 10px 20px -3px rgba(15,40,84,0.12), 0 4px 6px -2px rgba(15,40,84,0.05)',
        elevation: '0 20px 25px -5px rgba(15,40,84,0.15), 0 10px 10px -5px rgba(15,40,84,0.06)',
      },
    },
  },
  plugins: [],
};
