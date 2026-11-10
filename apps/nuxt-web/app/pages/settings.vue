<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useSyncStore } from '~/stores/sync'
import { useI18n } from '~/composables/useI18n'
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { exportTxt, exportDocx, sanitizeFilename, downloadFile } from '~/lib/export/formats'
import { exportPng } from '~/lib/export/png'
import { exportAllZip } from '~/lib/export/zip'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '~/components/ui/alert-dialog'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

const store = useResumeStore()
const syncStore = useSyncStore()
const { t } = useI18n()
const syncPass = ref('')
const syncRepeat = ref('')
const showSyncForm = ref(false)

async function handleCreateAccount() {
  if (syncPass.value !== syncRepeat.value) {
    syncStore.error = 'As frases-senha não coincidem.'
    return
  }
  const ok = await syncStore.createAccount(syncPass.value)
  if (ok) {
    syncPass.value = ''
    syncRepeat.value = ''
    showSyncForm.value = false
    toast.success('Conta criada — seus currículos foram sincronizados cifrados')
  }
}

async function handleSyncNow() {
  const ok = await syncStore.syncNow()
  if (ok) toast.success('Sincronizado')
  else toast.error(syncStore.error || 'Falha na sincronização')
}

function handleUnlock() {
  if (!syncStore.unlock(syncPass.value)) {
    syncStore.error = 'Use a frase-senha com pelo menos 8 caracteres.'
    return
  }
  syncPass.value = ''
  handleSyncNow()
}
/* ============ Animação 3D do hero (F6 #96) ============ */
const disable3d = ref(false)
const { locale, switchTo } = useI18n()

onMounted(() => {
  try {
    disable3d.value = localStorage.getItem('hirewerk-3d-off') === '1'
    const savedLocale = localStorage.getItem('hirewerk-locale')
    if (savedLocale === 'pt-BR' || savedLocale === 'en-US') switchTo(savedLocale)
  } catch { /* storage bloqueado */ }
})

function toggle3d() {
  disable3d.value = !disable3d.value
  try { localStorage.setItem('hirewerk-3d-off', disable3d.value ? '1' : '0') } catch { /* ignore */ }
}

function setAppLocale(e: Event) {
  switchTo((e.target as HTMLSelectElement).value as 'pt-BR' | 'en-US') // ref reativo + persistência
}

/* ============ Formato de arquivo configurável (F1 #40) ============ */
const filenamePattern = ref('{titulo}')
const exportTarget = ref<string | null>(null)

function buildFilename(resumeTitle: string, ext: string): string {
    const base = filenamePattern.value
        .replaceAll('{titulo}', resumeTitle)
        .replaceAll('{data}', new Date().toLocaleDateString('pt-BR').replaceAll('/', '-'))
        .replaceAll('{template}', '')
    return `${sanitizeFilename(base)}.${ext}`
}

/* ============ Per-currículo ============ */
const docs = computed(() =>
    store.index.filter(r => !r.deletedAt)
        .map(r => store.getResume(r.id))
        .filter((d): d is NonNullable<typeof d> => d !== null)
)

function exportOne(format: 'json' | 'txt' | 'docx' | 'png', doc: NonNullable<ReturnType<typeof store.getResume>>) {
    const title = doc.title
    switch (format) {
        case 'json':
            downloadFile(JSON.stringify(doc, null, 2), buildFilename(title, 'json'), 'application/json')
            break
        case 'txt':
            exportTxt(doc)
            break
        case 'docx':
            void exportDocx(doc)
            break
        case 'png':
            exportPng(doc, null)
            break
    }
    toast.success(`Exportado em ${format.toUpperCase()}`)
}

/* ============ Backup completo (F1 #6/#7) ============ */
const importInput = ref<HTMLInputElement | null>(null)

function handleExportAll() {
    const json = store.exportAll()
    downloadFile(json, `hirewerk-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
    toast.success('Backup completo exportado')
}

async function handleImportAll(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
        const text = await file.text()
        const count = store.importAll(text)
        toast.success(`${count} currículo(s) importado(s)`)
    } catch {
        toast.error('Arquivo de backup inválido')
    }
    input.value = ''
}

/* ============ Apagar tudo (F1 #8) ============ */
const confirmWipe = ref('')
const showWipe = ref(false)

function handleWipe() {
    if (confirmWipe.value !== 'APAGAR') return
    store.wipeAll()
    showWipe.value = false
    confirmWipe.value = ''
    toast.success('Todos os dados foram apagados')
}

/* ============ Uso do storage (F1 #9) ============ */
const usageBytes = computed(() => store.estimateUsage())
const usageMB = computed(() => (usageBytes.value / 1024 / 1024).toFixed(2))
// localStorage típico: 5MB
const usagePct = computed(() => Math.min(100, (usageBytes.value / (5 * 1024 * 1024)) * 100))

function handleExportZip() {
    const all = docs.value
    if (all.length === 0) {
        toast.error('Nenhum currículo para exportar')
        return
    }
    exportAllZip(all, '2.0.0')
    toast.success(`${all.length} currículo(s) no ZIP`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-10">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">{{ t('settings.title') }}</h1>
      <p class="text-muted-foreground mt-1 text-sm">Preferências do app, backups e espaço usado.</p>
    </div>

    <!-- Preferências (F6) -->
    <Card class="p-6 rounded-2xl space-y-4">
      <h2 class="font-display text-lg font-bold text-foreground">Preferências</h2>

      <div class="flex items-center justify-between gap-4">
        <div>
          <label class="text-sm font-semibold text-foreground">Idioma da interface</label>
          <p class="text-xs text-muted-foreground">Interface language</p>
        </div>
        <select
          :value="locale"
          class="flex h-9 rounded-md border border-input bg-card px-2 text-sm"
          aria-label="Idioma da interface"
          @change="setAppLocale"
        >
          <option value="pt-BR">Português (BR)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div>
          <label class="text-sm font-semibold text-foreground">{{ t('settings.3d') }}</label>
          <p class="text-xs text-muted-foreground">A folha que inclina seguindo o cursor</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" :checked="!disable3d" class="sr-only peer" @change="toggle3d" aria-label="Ativar animação 3D na página inicial" />
          <span class="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>
    </Card>

    <!-- Uso de armazenamento -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.storage') }}</h2>
      <div class="h-2 rounded-full bg-surface overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="usagePct > 80 ? 'bg-destructive' : 'bg-primary'"
          :style="{ width: `${usagePct}%` }"
        />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('settings.storageOf', { used: usageMB }) }}</p>
    </Card>

    <!-- Conta & Sync (F10.1) — 100% opt-in; offline continua pleno -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.sync') }}</h2>
      <p class="text-sm text-muted-foreground">
        Opcional. Seus currículos são cifrados no aparelho (AES-GCM, chave derivada da sua frase-senha)
        e o servidor guarda apenas blobs que <strong>ele mesmo não consegue ler</strong>. Sem conta, tudo continua
        funcionando offline como sempre.
      </p>

      <template v-if="!syncStore.hasAccount">
        <Button variant="secondary" size="sm" @click="showSyncForm = !showSyncForm">
          <Icon name="lucide:cloud-upload" class="w-4 h-4 mr-2" />
          Criar conta de sincronização
        </Button>
        <form v-if="showSyncForm" class="space-y-2 max-w-sm" @submit.prevent="handleCreateAccount">
          <Input v-model="syncPass" type="password" placeholder="Frase-senha (mín. 8 caracteres)" aria-label="Frase-senha de sincronização" />
          <Input v-model="syncRepeat" type="password" placeholder="Repetir frase-senha" aria-label="Repetir frase-senha" />
          <p v-if="syncStore.error" class="text-xs text-destructive" role="alert">{{ syncStore.error }}</p>
          <Button type="submit" size="sm">Criar e sincronizar</Button>
        </form>
      </template>

      <template v-else-if="!syncStore.unlocked">
        <p class="text-xs text-muted-foreground">Conta ativa. Digite a frase-senha para destravar o sync nesta sessão (fica só na memória).</p>
        <form class="space-y-2 max-w-sm" @submit.prevent="handleUnlock">
          <Input v-model="syncPass" type="password" placeholder="Sua frase-senha" aria-label="Frase-senha de sincronização" />
          <Button type="submit" size="sm">
            <Icon name="lucide:unlock" class="w-4 h-4 mr-2" />
            Destravar e sincronizar
          </Button>
        </form>
      </template>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" :disabled="syncStore.syncing" @click="handleSyncNow">
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" :class="{ 'animate-spin': syncStore.syncing }" />
            {{ syncStore.syncing ? 'Sincronizando…' : 'Sincronizar agora' }}
          </Button>
          <Button variant="ghost" size="sm" @click="syncStore.lock()">Travar sessão</Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive-soft">Excluir conta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta de sync?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove a conta e TODOS os blobs do servidor. Seus currículos locais continuam intactos no aparelho.
                  Currículos em outros aparelhos não serão mais sincronizados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction @click="syncStore.logout(); toast.success('Conta removida do servidor')">
                  Excluir conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p v-if="syncStore.lastSync" class="text-xs text-muted-foreground">Último sync: {{ new Date(syncStore.lastSync).toLocaleString('pt-BR') }}</p>
        <p v-if="syncStore.error" class="text-xs text-destructive" role="alert">{{ syncStore.error }}</p>
      </template>
    </Card>

    <!-- Nome de arquivo -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.filename') }}</h2>
      <p class="text-sm text-muted-foreground">Variáveis: <code class="text-xs bg-surface px-1.5 py-0.5 rounded">{titulo}</code> <code class="text-xs bg-surface px-1.5 py-0.5 rounded">{data}</code></p>
      <Input v-model="filenamePattern" class="max-w-xs font-mono text-sm" aria-label="Padrão de nome dos arquivos exportados" />
    </Card>

    <!-- Export múltiplo -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.exportAll') }}</h2>
      <p class="text-sm text-muted-foreground">ZIP com JSON + TXT de cada currículo.</p>
      <Button variant="outline" @click="handleExportZip">{{ t('settings.zip') }}</Button>
    </Card>

    <!-- Backup / restauração -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.backup') }}</h2>
      <p class="text-sm text-muted-foreground">Um arquivo com todos os currículos, versões e preferências. Use para migrar de aparelho.</p>
      <div class="flex flex-wrap gap-3">
        <Button @click="handleExportAll">Exportar backup</Button>
        <Button variant="outline" @click="importInput?.click()">Importar backup</Button>
        <input ref="importInput" type="file" accept="application/json" class="hidden" @change="handleImportAll" />
      </div>
    </Card>

    <!-- Zona de perigo -->
    <Card class="p-6 rounded-2xl space-y-3 border-destructive-soft">
      <h2 class="font-display text-lg font-bold text-destructive">{{ t('settings.wipe') }}</h2>
      <p class="text-sm text-muted-foreground">Remove permanentemente todos os currículos, versões e preferências deste aparelho. Isto não pode ser desfeito.</p>
      <Button variant="destructive" @click="showWipe = true">Apagar todos os dados</Button>
    </Card>

    <!-- Lista de exports rápidos -->
    <Card v-if="docs.length > 0" class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">Exportação rápida</h2>
      <div v-for="doc in docs" :key="doc.id" class="flex flex-wrap items-center gap-2 py-2 border-b border-border-soft last:border-0">
        <span class="text-sm font-semibold text-foreground flex-1 min-w-[150px] truncate">{{ doc.title }}</span>
        <Button variant="ghost" size="sm" @click="exportOne('json', doc)">JSON</Button>
        <Button variant="ghost" size="sm" @click="exportOne('txt', doc)">TXT</Button>
        <Button variant="ghost" size="sm" @click="exportOne('docx', doc)">DOCX</Button>
        <Button variant="ghost" size="sm" @click="exportOne('png', doc)">PNG</Button>
      </div>
    </Card>

    <!-- Dialog de wipe -->
    <AlertDialog :open="showWipe" @update:open="showWipe = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar tudo?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os currículos, versões salvas e preferências serão removidos permanentemente deste aparelho.
            Digite <strong>APAGAR</strong> para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input v-model="confirmWipe" placeholder="APAGAR" class="max-w-[200px]" />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive-soft text-destructive hover:bg-destructive/20"
            :disabled="confirmWipe !== 'APAGAR'"
            @click="handleWipe"
          >
            Apagar definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
