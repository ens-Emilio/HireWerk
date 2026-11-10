export interface SectionConfig {
  key: string
  label: string
  icon: string
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'personal', label: 'Dados Pessoais', icon: 'lucide:user' },
  { key: 'experience', label: 'Experiência', icon: 'lucide:briefcase' },
  { key: 'education', label: 'Educação', icon: 'lucide:graduation-cap' },
  { key: 'skills', label: 'Habilidades', icon: 'lucide:star' },
  { key: 'links', label: 'Links', icon: 'lucide:link' },
  { key: 'projects', label: 'Projetos', icon: 'lucide:folder-git-2' },
  { key: 'certifications', label: 'Certificações', icon: 'lucide:award' },
  { key: 'languages', label: 'Idiomas', icon: 'lucide:languages' },
  { key: 'volunteer', label: 'Voluntariado', icon: 'lucide:heart-handshake' },
]
