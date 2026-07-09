/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        grafite: {
          950: '#121212',
          900: '#1A1A1A',
          800: '#222226',
          700: '#2E2E33',
          600: '#3D3D43',
          500: '#5A5A62',
          400: '#8A8A93',
        },
        verde: {
          600: '#149E73',
          500: '#22D3A6',
          400: '#5CE4C4',
        },
        azul: {
          600: '#0B84B8',
          500: '#0EA5E9',
          400: '#38BDF8',
          300: '#7DD3FC',
        },
        atencao: {
          500: '#F5A524',
        },
        critico: {
          500: '#F04438',
        },
        off: {
          white: '#F5F5F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

