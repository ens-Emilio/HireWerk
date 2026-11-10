<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '~/components/ui/alert-dialog'

const store = useResumeStore()

const deletedResumes = computed(() =>
  store.index.filter(r => r.deletedAt !== null)
)

const isLoading = ref(false)
const targetResume = ref<{ id: string; title: string } | null>(null)
const showDeleteDialog = ref(false)
const showEmptyDialog = ref(false)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

async function handleRestore(id: string, title: string) {
  isLoading.value = true
  try {
    store.restore(id)
    toast.success('Restaurado', { description: `"${title}" voltou para seus currículos.` })
  } catch {
    toast.error('Erro', { description: 'Não foi possível restaurar.' })
  } finally {
    isLoading.value = false
  }
}

function confirmDelete(resume: { id: string; title: string }) {
  targetResume.value = resume
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!targetResume.value) return
  isLoading.value = true
  try {
    store.hardDelete(targetResume.value.id)
    toast.success('Excluído', { description: `"${targetResume.value.title}" foi removido permanentemente.` })
    targetResume.value = null
  } catch {
    toast.error('Erro', { description: 'Falha ao excluir permanentemente.' })
  } finally {
    isLoading.value = false
    showDeleteDialog.value = false
  }
}

function confirmEmptyTrash() {
  showEmptyDialog.value = true
}

async function executeEmptyTrash() {
  isLoading.value = true
  try {
    store.emptyTrash()
    toast.success('Lixeira esvaziada', { description: 'Todos os currículos foram removidos permanentemente.' })
  } catch {
    toast.error('Erro', { description: 'Não foi possível esvaziar a lixeira.' })
  } finally {
    isLoading.value = false
    showEmptyDialog.value = false
  }
}
</script>

<template>
  <div class="space-y-9 min-h-[73vh]">
    <div v-if="!store.ready" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-foreground">Lixeira</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Nada desaparece de imediato: currículos aqui podem ser restaurados a qualquer momento.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <NuxtLink
            to="/resumes"
            class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Voltar para Meus Currículos
          </NuxtLink>
          <AlertDialog
            v-if="deletedResumes.length > 0"
            :open="showEmptyDialog"
            @update:open="showEmptyDialog = $event"
          >
            <AlertDialogTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Esvaziar Lixeira
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ deletedResumes.length }} currículo(s) serão apagados junto com o histórico de versões. Isto não pode ser desfeito.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  @click="executeEmptyTrash"
                  :disabled="isLoading"
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {{ isLoading ? 'Excluindo...' : 'Sim, esvaziar' }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card v-if="deletedResumes.length > 0" class="w-full overflow-hidden">
        <div class="divide-y divide-border">
          <div
            v-for="r in deletedResumes"
            :key="r.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div class="flex-shrink-0 p-2 bg-destructive/10 rounded-lg">
                <Icon name="lucide:file-x" class="w-5 h-5 text-destructive" />
              </div>
              <div class="min-w-0">
                <p class="font-medium text-sm truncate">{{ r.title }}</p>
                <p class="text-xs text-muted-foreground">Removido em {{ formatDate(r.deletedAt!) }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                @click="handleRestore(r.id, r.title)"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Restaurando...' : 'Restaurar' }}
              </Button>

              <AlertDialog
                :open="showDeleteDialog && targetResume?.id === r.id"
                @update:open="showDeleteDialog = $event"
              >
                <AlertDialogTrigger as-child>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="text-destructive hover:bg-destructive-soft hover:text-destructive"
                    @click="confirmDelete({ id: r.id, title: r.title })"
                  >
                    Excluir de vez
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir de vez?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "<strong>{{ r.title }}</strong>" sai da lixeira e desaparece para sempre, incluindo as versões salvas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      @click="executeDelete"
                      :disabled="isLoading"
                      class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {{ isLoading ? 'Excluindo...' : 'Sim, excluir' }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </Card>

      <div
        v-else
        class="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border/50 rounded-2xl bg-surface/40 min-h-[42vh]"
      >
        <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-muted-foreground mb-5 font-display text-2xl font-extrabold">H</div>
        <h3 class="font-display text-lg font-bold text-foreground">Lixeira vazia</h3>
        <p class="text-sm text-muted-foreground mt-2 text-center max-w-sm">
          Quando você excluir um currículo, ele aparece aqui e continua recuperável.
        </p>
        <Button as-child variant="outline" class="mt-6">
          <NuxtLink to="/resumes">Ver currículos ativos</NuxtLink>
        </Button>
      </div>
    </template>
  </div>
</template>