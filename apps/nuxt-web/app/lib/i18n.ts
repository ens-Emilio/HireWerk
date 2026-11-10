/**
 * i18n (F6): dicionários pt-BR / en-US. Strings de UI do app.
 * ponytail: app pequeno — objeto plano + função t() em vez de vue-i18n.
 */

export type Locale = 'pt-BR' | 'en-US'

const messages: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    // navegação
    'nav.dashboard': 'Dashboard',
    'nav.resumes': 'Currículos',
    'nav.templates': 'Modelos',
    'nav.settings': 'Config.',
    'nav.trash': 'Lixeira',
    'nav.about': 'Sobre',
    // ações comuns
    'action.save': 'Salvar',
    'action.cancel': 'Cancelar',
    'action.delete': 'Excluir',
    'action.restore': 'Restaurar',
    'action.duplicate': 'Duplicar',
    'action.share': 'Compartilhar',
    'action.edit': 'Editar',
    'action.close': 'Fechar',
    'action.new': 'Novo currículo',
    // estados
    'state.saving': 'Salvando…',
    'state.saved': 'Salvo',
    'state.loading': 'Carregando seus currículos…',
    'state.empty.title': 'Nenhum currículo ainda',
    'state.empty.text': 'Crie o primeiro agora, leva menos de um minuto.',
    'state.empty.cta': 'Criar meu primeiro currículo',
    // lista
    'list.search': 'Buscar por título, vaga ou tag...',
    'list.sort.recent': 'Mais recentes',
    'list.sort.name': 'Nome (A–Z)',
    'list.updated': 'atualizado em',
    // editor
    'editor.pdf': 'Baixar PDF',
    'editor.copy': 'Salvar cópia',
    'editor.versions': 'Versões',
    'editor.undo': 'Desfazer',
    'editor.redo': 'Refazer',
    'editor.complete': 'completo',
    // share
    'share.linkCopied': 'Link copiado!',
    'share.clipboard': 'Link copiado para a área de transferência!',
  },
  'en-US': {
    'nav.dashboard': 'Dashboard',
    'nav.resumes': 'Résumés',
    'nav.templates': 'Templates',
    'nav.settings': 'Settings',
    'nav.trash': 'Trash',
    'nav.about': 'About',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.restore': 'Restore',
    'action.duplicate': 'Duplicate',
    'action.share': 'Share',
    'action.edit': 'Edit',
    'action.close': 'Close',
    'action.new': 'New résumé',
    'state.saving': 'Saving…',
    'state.saved': 'Saved',
    'state.loading': 'Loading your résumés…',
    'state.empty.title': 'No résumés yet',
    'state.empty.text': 'Create your first one now — it takes less than a minute.',
    'state.empty.cta': 'Create my first résumé',
    'list.search': 'Search by title, job or tag...',
    'list.sort.recent': 'Most recent',
    'list.sort.name': 'Name (A–Z)',
    'list.updated': 'updated on',
    'editor.pdf': 'Download PDF',
    'editor.copy': 'Save a copy',
    'editor.versions': 'Versions',
    'editor.undo': 'Undo',
    'editor.redo': 'Redo',
    'editor.complete': 'complete',
    'share.linkCopied': 'Link copied!',
    'share.clipboard': 'Link copied to your clipboard!',
  },
}

export function getLocale(): Locale {
  try {
    const saved = localStorage.getItem('hirewerk-locale')
    if (saved === 'pt-BR' || saved === 'en-US') return saved
  } catch { /* storage bloqueado */ }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('en')) return 'en-US'
  return 'pt-BR'
}

export function setLocale(locale: Locale): void {
  try { localStorage.setItem('hirewerk-locale', locale) } catch { /* ignore */ }
}
