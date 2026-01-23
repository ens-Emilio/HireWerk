import type { Config } from 'tailwindcss'

export default {
    content: [
        './app/**/*.{js,vue,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/components/**/*.vue',
    ],
    theme: {
        extend: {
            colors: {
                background: '#FFFFFF',
                foreground: '#0F172A',
                primary: {
                    DEFAULT: '#2563EB',
                    foreground: '#FFFFFF',
                },
                accent: {
                    DEFAULT: '#F59E0B',
                    foreground: '#0F172A',
                },
                surface: {
                    DEFAULT: '#F8FAFC',
                    foreground: '#0F172A',
                },
                border: '#E2E8F0',
                muted: '#64748B',
                success: '#10B981',
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
