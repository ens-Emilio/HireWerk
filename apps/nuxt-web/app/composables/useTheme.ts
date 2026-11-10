import { ref, onMounted, watch } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
    const theme = ref<Theme>('light')

    function applyTheme(newTheme: Theme) {
        if (import.meta.server) return

        const html = document.documentElement

        html.classList.remove('theme-light', 'theme-dark')

        if (newTheme === 'dark') {
            html.classList.add('dark')
        } else {
            html.classList.remove('dark')
        }

        theme.value = newTheme
        html.style.colorScheme = newTheme

        localStorage.setItem('hirewerk-theme', newTheme)
    }

    function toggleTheme() {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
    }

    onMounted(() => {
        const saved = localStorage.getItem('hirewerk-theme') as Theme | null

        if (saved && (saved === 'light' || saved === 'dark')) {
            applyTheme(saved)
        } else {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            applyTheme(systemDark ? 'dark' : 'light')
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('hirewerk-theme')) {
                applyTheme(e.matches ? 'dark' : 'light')
            }
        })
    })

    return {
        theme,
        toggleTheme
    }
}
