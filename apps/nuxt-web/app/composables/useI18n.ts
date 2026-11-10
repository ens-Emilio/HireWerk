import { ref, computed } from 'vue'
import { getLocale, setLocale, type Locale } from '~/lib/i18n'

/** Locale reativo (F6) */
const current = ref<Locale>('pt-BR')

if (typeof window !== 'undefined') {
  current.value = getLocale()
}

export function useI18n() {
  function t(key: string): string {
    return messages.value[key] ?? key
  }

  const messages = computed(() => {
    // resolução tardia evita import cycle no bundle
    const dicts = {
      'pt-BR': { 'nav.dashboard': 'Dashboard', 'nav.resumes': 'Currículos', 'nav.templates': 'Modelos', 'nav.settings': 'Config.', 'nav.trash': 'Lixeira', 'nav.about': 'Sobre' },
      'en-US': { 'nav.dashboard': 'Dashboard', 'nav.resumes': 'Résumés', 'nav.templates': 'Templates', 'nav.settings': 'Settings', 'nav.trash': 'Trash', 'nav.about': 'About' },
    } as Record<Locale, Record<string, string>>
    return dicts[current.value] ?? dicts['pt-BR']!
  })

  function switchTo(locale: Locale) {
    current.value = locale
    setLocale(locale)
  }

  return { t, locale: current, switchTo }
}
