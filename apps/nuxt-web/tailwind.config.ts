import type { Config } from 'tailwindcss'

export default {
    content: [
        './app/**/*.{js,vue,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/components/**/*.vue',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                border: 'var(--border)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                muted: 'var(--muted)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                surface: {
                    DEFAULT: 'var(--surface)',
                    foreground: 'var(--surface-foreground)',
                },
                ring: 'var(--ring)',
                success: '#10B981', // Manter hardcoded se não houver variável ou criar variável depois
                danger: '#EF4444',
            },
            borderRadius: {
                base: 'var(--radius)',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
} satisfies Config
