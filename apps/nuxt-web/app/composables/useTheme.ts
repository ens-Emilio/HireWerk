import { ref, onMounted, watch } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
    const theme = ref<Theme>('light')

    function applyTheme(newTheme: Theme) {
        const root = document.documentElement

        // Remover classes antigas de tema se existirem
        root.classList.remove('theme-light', 'theme-dark')

        if (newTheme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

        theme.value = newTheme

        // Opcional: Atualizar meta 'color-scheme'
        root.style.colorScheme = newTheme
    }

    function toggleTheme() {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
        localStorage.setItem('hirewerk-theme', newTheme)
    }

    // Inicializar
    onMounted(() => {
        // 1. Tentar ler do localStorage
        const saved = localStorage.getItem('hirewerk-theme') as Theme | null

        if (saved && (saved === 'light' || saved === 'dark')) {
            applyTheme(saved)
        } else {
            // 2. Fallback para preferência do sistema
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            applyTheme(systemDark ? 'dark' : 'light')
        }
    })

    return {
        theme,
        toggleTheme
    }
}
