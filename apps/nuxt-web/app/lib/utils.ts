import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/** Idioma pode vir como string livre ou { name, level } — imprime sempre texto. */
export function formatLanguage(l: string | { name?: string; level?: string } | null | undefined): string {
  if (!l) return ''
  if (typeof l === 'string') return l
  const name = (l.name ?? '').trim()
  const level = (l.level ?? '').trim()
  if (!name) return ''
  return level ? `${name} (${level})` : name
}
