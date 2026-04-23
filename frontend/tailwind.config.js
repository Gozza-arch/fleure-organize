export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8b5cf6',
          50:  '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9'
        }
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
        'glow-sm': '0 0 10px rgba(139,92,246,0.15)'
      }
    }
  },
  plugins: []
}
