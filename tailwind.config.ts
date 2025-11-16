import type { Config } from 'tailwindcss'


export default {
content: [
'./app/**/*.{ts,tsx}',
'./components/**/*.{ts,tsx}',
],
theme: {
  extend: {
    colors: {
      brand: {
        red: 'var(--brand-red)',
        redDark: 'var(--brand-red-dark)',
        coal: 'var(--coal)',
        paper: 'var(--paper)',
      }
    }
  }
}
,
plugins: [],
} satisfies Config