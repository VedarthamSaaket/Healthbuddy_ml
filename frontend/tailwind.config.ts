
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages*.{js,ts,jsx,tsx,mdx}',
    './src/components*.{js,ts,jsx,tsx,mdx}',
    './src/app*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display:    ['var(--font-cormorant)', 'serif'],
        body:       ['var(--font-eb-garamond)', 'serif'],
        mono:       ['var(--font-space-mono)', 'monospace'],
        gothic:     ['var(--font-cinzel)', 'serif'],
        editorial:  ['var(--font-playfair)', 'serif'],
        future:     ['var(--font-rajdhani)', 'sans-serif'],
        philosopher:['var(--font-philosopher)', 'serif'],
      },
      colors: {
        hb: {
          teal1:   '#2bd2ff',
          teal2:   '#00b4d8',
          green1:  '#2bff88',
          green2:  '#06d6a0',
          violet1: '#c5a2f2',
          violet2: '#7b5ea7',
          gold:    '#d4af37',
          emergency: '#dc2626',
          deep:    '#0a0f1a',
        },
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 3s ease-in-out infinite',
        'text-shimmer':  'textShimmer 3s linear infinite',
        'slide-up':      'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':       'fadeIn 0.8s ease forwards',
        'emergency-pulse':'emergencyPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(43,210,255,0.3)' },
          '50%':     { boxShadow: '0 0 60px rgba(43,210,255,0.8)' },
        },
        textShimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        emergencyPulse: {
          '0%,100%': { borderColor: '#dc2626', boxShadow: '0 0 20px rgba(220,38,38,0.5)' },
          '50%':     { borderColor: '#ff4444', boxShadow: '0 0 60px rgba(255,68,68,0.9)' },
        },
      },
    },
  },
  plugins: [],
}
