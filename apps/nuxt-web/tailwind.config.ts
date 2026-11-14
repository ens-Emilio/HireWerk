import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
    content: [
        './app/**/*.{js,vue,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/components/**/*.vue',
    ],
    darkMode: ['class'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: { '2xl': '1400px' },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                'border-soft': 'hsl(var(--border-soft, 244 39% 94%))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
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
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                surface: {
                    DEFAULT: 'hsl(var(--surface))',
                    foreground: 'hsl(var(--surface-foreground))',
                },
                success: 'hsl(var(--success))',
                'success-soft': 'hsl(var(--success-soft))',
                danger: 'hsl(var(--destructive))',
                'accent-hover': '#c2410c',
            },
            boxShadow: {
                ring: '0 0 0 1px hsl(var(--border))',
                raised: '0 18px 44px rgba(30, 30, 36, 0.14)',
            },
            borderRadius: {
                sm: '0.5rem',
                md: '0.875rem',
                lg: '1.375rem',
                base: 'var(--radius)',
            },
            fontFamily: {
                sans: ['"Noto Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['"Sora"', '"Noto Sans"', 'ui-sans-serif', 'sans-serif'],
            },
        },
    },
    plugins: [animate],
} satisfies Config
