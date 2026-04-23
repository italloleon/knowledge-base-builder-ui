import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        success: '#16a34a',
        warning: '#ca8a04',
        error: '#dc2626',
      },
    },
  },
  plugins: [],
}

export default config
