import { ref, computed } from 'vue'
import { getLocale, setLocale, translate, type Locale } from '~/lib/i18n'

/** Locale reativo (F6). Dicionário central em ~/lib/i18n.ts */
const current = ref<Locale>('pt-BR')

if (typeof window !== 'undefined') {
  current.value = getLocale()
}

export function useI18n() {
  const locale = computed(() => current.value)

  /** t('key', {n: 3}) — interpola {param} do dicionário central */
  function t(key: string, params?: Record<string, string | number>): string {
    return translate(current.value, key, params)
  }

  function switchTo(next: Locale) {
    current.value = next
    setLocale(next)
  }

  return { t, locale, switchTo }
}
