import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        primaryForeground: 'var(--color-primary-foreground)',
        accent: 'var(--color-accent)',
        accentForeground: 'var(--color-accent-foreground)',
        panel: 'var(--color-panel)',
        border: 'var(--color-border)',
        glow: 'var(--color-glow)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(72, 243, 165, 0.35)',
      },
    },
  },
  plugins: [],
}
export default config
