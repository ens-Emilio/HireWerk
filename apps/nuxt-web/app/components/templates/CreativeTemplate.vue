<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeData } from '~/lib/storage/schema'

const props = defineProps<{
  data: ResumeData
}>()

const name = computed(() => props.data.name?.trim() || "Nome Completo")
const headline = computed(() => props.data.headline?.trim() || "Profissão / Título")
const summary = computed(() => props.data.summary?.trim() || "Resumo profissional aparecerá aqui.")
const skills = computed(() => (props.data.skills ?? []).filter(Boolean))
const softSkills = computed(() => (props.data.softSkills ?? []).filter(Boolean))
const experiences = computed(() => (props.data.experiences ?? []).filter((e) => e && (e.role || e.company)))
const education = computed(() => (props.data.education ?? []).filter((e) => e && (e.course || e.institution)))
const languages = computed(() => (props.data.languages ?? []).map(l => typeof l === 'string' ? l : `${l.name} (${l.level})`).filter(Boolean))
const projects = computed(() => (props.data.projects ?? []).filter(p => p.name))
const links = computed(() => (props.data.links ?? []).filter(l => l.url))
</script>

<template>
  <div class="flex min-h-full text-foreground">
    <!-- Sidebar colorida -->
    <aside class="w-[35%] bg-[#17153a] text-white p-4 space-y-4 shrink-0">
      <div>
        <div class="font-bold text-base leading-tight">{{ name }}</div>
        <div class="text-[10px] uppercase tracking-widest text-white/60 mt-0.5">{{ headline }}</div>
      </div>

      <div v-if="links.length" class="space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-widest text-white/50">Contato</div>
        <div v-for="(l, i) in links" :key="i" class="text-[10px] break-all">{{ l.label || l.url }}</div>
      </div>

      <div v-if="skills.length" class="space-y-1.5">
        <div class="text-[10px] font-bold uppercase tracking-widest text-white/50">Skills</div>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, i) in skills" :key="i" class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#ffd02f] text-[#17153a]">{{ s }}</span>
        </div>
      </div>

      <div v-if="softSkills.length" class="space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-widest text-white/50">Competências</div>
        <div v-for="(s, i) in softSkills" :key="i" class="text-[10px] text-white/85">• {{ s }}</div>
      </div>

      <div v-if="languages.length" class="space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-widest text-white/50">Idiomas</div>
        <div v-for="(l, i) in languages" :key="i" class="text-[10px] text-white/85">{{ l }}</div>
      </div>
    </aside>

    <!-- Conteúdo -->
    <div class="flex-1 p-4 space-y-4">
      <div class="text-[13px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

      <div v-if="experiences.length">
        <div class="text-xs font-bold uppercase tracking-widest text-[#4a5df9]">Experiência</div>
        <div class="mt-2 space-y-3">
          <div v-for="(exp, i) in experiences" :key="i">
            <div class="font-bold text-sm">{{ exp.role }}<span v-if="exp.company" class="font-normal text-muted-foreground"> · {{ exp.company }}</span></div>
            <div v-if="exp.period" class="text-[10px] text-muted-foreground">{{ exp.period }}</div>
            <p v-if="exp.description" class="text-[12px] mt-0.5 whitespace-pre-wrap">{{ exp.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="projects.length">
        <div class="text-xs font-bold uppercase tracking-widest text-[#4a5df9]">Projetos</div>
        <div class="mt-2 space-y-2">
          <div v-for="(p, i) in projects" :key="i">
            <div class="font-bold text-sm">{{ p.name }}</div>
            <div v-if="p.stack" class="text-[10px] text-muted-foreground">{{ p.stack }}</div>
            <p v-if="p.description" class="text-[12px] mt-0.5">{{ p.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="education.length">
        <div class="text-xs font-bold uppercase tracking-widest text-[#4a5df9]">Formação</div>
        <div class="mt-2 space-y-1 text-sm">
          <div v-for="(ed, i) in education" :key="i">
            {{ ed.course }}<span v-if="ed.institution" class="text-muted-foreground"> — {{ ed.institution }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
