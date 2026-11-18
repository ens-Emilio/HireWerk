<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useSyncStore } from '~/stores/sync'
import { useI18n } from '~/composables/useI18n'
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { exportTxt, exportDocx, sanitizeFilename, downloadFile } from '~/lib/export/formats'
import { exportPng } from '~/lib/export/png'
import { exportAllZip } from '~/lib/export/zip'
import { toJsonResume, fromJsonResume, looksLikeJsonResume } from '~/lib/export/jsonresume'
import { isEncryptionEnabled, isUnlocked, enableEncryption, unlockEncryption, lockEncryption, disableEncryption } from '~/lib/storage/crypto'
import { listShares, removeShare, type ShareRecord } from '~/lib/api'
import { Badge } from '~/components/ui/badge'
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
    syncStore.error = t('toast.syncPassMismatch')
    return
  }
  const ok = await syncStore.createAccount(syncPass.value)
  if (ok) {
    syncPass.value = ''
    syncRepeat.value = ''
    showSyncForm.value = false
    toast.success(t('toast.syncCreated'))
  }
}

async function handleSyncNow() {
  const ok = await syncStore.syncNow()
  if (ok) toast.success(t('toast.syncDone'))
  else toast.error(syncStore.error || t('toast.syncFailed'))
}

function handleUnlock() {
  if (!syncStore.unlock(syncPass.value)) {
    syncStore.error = t('toast.syncPassShort')
    return
  }
  syncPass.value = ''
  handleSyncNow()
}
/* ============ Animação 3D do hero (F6 #96) ============ */
const disable3d = ref(false)
const { locale, switchTo } = useI18n()

/**
 * Idioma da interface.
 *
 * `<select :value>` só funciona porque o Vue patcheia o atributo `value`, que
 * não é o estado nativo do select — a escolha do usuário pode ser revertida no
 * próximo render. `v-model` num computed gravável lê do ref reativo e escreve
 * via `switchTo`, que persiste e re-renderiza a árvore toda.
 */
const appLocale = computed({
  get: () => locale.value,
  set: (next) => switchTo(next as 'pt-BR' | 'en-US'),
})

onMounted(() => {
  try {
    disable3d.value = localStorage.getItem('hirewerk-3d-off') === '1'
  } catch { /* storage bloqueado */ }
})

function toggle3d() {
  disable3d.value = !disable3d.value
  try { localStorage.setItem('hirewerk-3d-off', disable3d.value ? '1' : '0') } catch { /* ignore */ }
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
    toast.success(t('toast.exported', { format: format.toUpperCase() }))
}

/* ============ Backup completo (F1 #6/#7) ============ */
const importInput = ref<HTMLInputElement | null>(null)

function handleExportAll() {
    try {
        const json = store.exportAll()
        downloadFile(json, `hirewerk-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
        toast.success(t('toast.backupExported'))
    } catch (err) {
        toast.error(err instanceof Error ? err.message : t('toast.backupInvalid'))
    }
}

async function handleImportAll(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
        const text = await file.text()
        const count = store.importAll(text)
        toast.success(t('toast.backupImported', { n: count }))
    } catch {
        toast.error(t('toast.backupInvalid'))
    }
    input.value = ''
}

/* ============ Apagar tudo (F1 #8) ============ */
const confirmWipe = ref('')
/** Palavra de confirmação localizada (APAGAR / ERASE) */
const wipeWord = computed(() => t('settings.wipePlaceholder'))
const showWipe = ref(false)

function handleWipe() {
    if (confirmWipe.value !== wipeWord.value) return
    store.wipeAll()
    showWipe.value = false
    confirmWipe.value = ''
    toast.success(t('toast.wiped'))
}

/* ============ Uso do storage (F1 #9) ============ */
const usageBytes = computed(() => store.estimateUsage())
const usageMB = computed(() => (usageBytes.value / 1024 / 1024).toFixed(2))
// localStorage típico: 5MB
const usagePct = computed(() => Math.min(100, (usageBytes.value / (5 * 1024 * 1024)) * 100))

function handleExportZip() {
    const all = docs.value
    if (all.length === 0) {
        toast.error(t('toast.nothingToExport'))
        return
    }
    exportAllZip(all, '3.0.0')
    toast.success(t('toast.zipExported', { n: all.length }))
}

/* ============ v3: JSON Resume (padrão aberto) ============ */
const jrInput = ref<HTMLInputElement | null>(null)

function handleExportJsonResume() {
    const all = docs.value
    if (all.length === 0) {
        toast.error(t('toast.nothingToExport'))
        return
    }
    // Um arquivo por currículo seria ruído; o ZIP leva todos num formato só
    for (const doc of all) {
        downloadFile(
            JSON.stringify(toJsonResume(doc), null, 2),
            buildFilename(doc.title, 'json'),
            'application/json',
        )
    }
    toast.success(t('jsonresume.export'))
}

async function handleImportJsonResume(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
        const parsed = JSON.parse(await file.text())
        if (!looksLikeJsonResume(parsed)) {
            toast.error(t('jsonresume.invalid'))
            return
        }
        const data = fromJsonResume(parsed)
        const title = parsed.basics?.name ? `Currículo — ${parsed.basics.name}` : 'Currículo importado'
        const doc = store.createResume()
        store.updateResume({ ...doc, title, data: { ...doc.data, ...data } })
        toast.success(t('jsonresume.imported'))
    } catch {
        toast.error(t('jsonresume.invalid'))
    }
    input.value = ''
}

/* ============ v3: criptografia local ============ */
const cryptoPass = ref('')
const cryptoTarget = ref<'enable' | 'unlock' | null>(null)
const cryptoOn = ref(isEncryptionEnabled())
const cryptoUnlocked = ref(isUnlocked())

async function doEnableCrypto() {
    const ok = await enableEncryption(cryptoPass.value)
    cryptoPass.value = ''
    cryptoOn.value = isEncryptionEnabled()
    cryptoUnlocked.value = isUnlocked()
    if (!ok) { toast.error(t('crypto.pass')); return }
    // Falha no meio (quota) deixaria docs em claro com a UI dizendo "ativada".
    try {
        const n = await store.encryptAllDocs()
        toast.success(t('crypto.enabled'))
        toast.warning(t('crypto.warn'))
        if (n > 0) toast.success(t('toast.cryptoDocsEncrypted', { n }))
    } catch (err) {
        toast.error(t('crypto.enablePartial', { msg: err instanceof Error ? err.message : '' }))
    }
    cryptoTarget.value = null
}

async function doUnlockCrypto() {
    const ok = await unlockEncryption(cryptoPass.value)
    cryptoPass.value = ''
    cryptoUnlocked.value = isUnlocked()
    if (!ok) { toast.error(t('crypto.wrong')); return }
    const n = await store.unlockDocs()
    toast.success(t('crypto.unlock'))
    if (n > 0) toast.success(t('toast.cryptoDocsUnlocked', { n }))
    cryptoTarget.value = null
}

function doLockCrypto() {
    lockEncryption()
    store.clearPlainCache()
    cryptoUnlocked.value = false
    toast.success(t('crypto.lock'))
}

async function doDisableCrypto() {
    const { ok, failed } = await store.decryptAllDocs()
    if (failed.length > 0) {
        // Sem a chave, esses docs ficariam cifrados para sempre.
        toast.error(t('crypto.disableBlocked', { n: failed.length }))
        return
    }
    disableEncryption()
    cryptoOn.value = false
    cryptoUnlocked.value = false
    toast.success(t('crypto.disabled', { n: ok }))
}

/* ============ v3: links criados ============ */
const shares = ref<ShareRecord[]>([])
onMounted(() => { shares.value = listShares() })

function dropShare(id: string) {
    removeShare(id)
    shares.value = listShares()
}

/* ============ v3: conflitos de sync ============ */
function resolveConflict(docId: string, keep: 'local' | 'remote') {
    syncStore.resolveConflict(docId, keep)
    toast.success(t('sync.conflictResolved'))
}

</script>

<template>
  <div class="max-w-3xl mx-auto space-y-10">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">{{ t('settings.title') }}</h1>
      <p class="text-muted-foreground mt-1 text-sm">{{ t('settings.subtitle') }}</p>
    </div>

    <!-- Preferências (F6) -->
    <Card class="p-6 rounded-2xl space-y-4">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.preferences') }}</h2>

      <div class="flex items-center justify-between gap-4">
        <div>
          <label class="text-sm font-semibold text-foreground">{{ t('settings.languageLabel') }}</label>
          <p class="text-xs text-muted-foreground">{{ t('settings.language') }}</p>
        </div>
        <select
          id="app-locale"
          v-model="appLocale"
          class="flex h-9 rounded-md border border-input bg-card px-2 text-sm"
          :aria-label="t('settings.languageLabel')"
        >
          <option value="pt-BR">Português (BR)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div>
          <label class="text-sm font-semibold text-foreground">{{ t('settings.3d') }}</label>
          <p class="text-xs text-muted-foreground">{{ t('settings.3dHint') }}</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" :checked="!disable3d" class="sr-only peer" @change="toggle3d" :aria-label="t('aria.animate3d')" />
          <span class="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>
    </Card>

    <!-- Uso de armazenamento -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.storageUsed') }}</h2>
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
      <p class="text-sm text-muted-foreground">{{ t('settings.syncDesc') }}</p>

      <template v-if="!syncStore.hasAccount">
        <Button variant="secondary" size="sm" @click="showSyncForm = !showSyncForm">
          <Icon name="lucide:cloud-upload" class="w-4 h-4 mr-2" />
          {{ t('settings.syncCreateTitle') }}
        </Button>
        <form v-if="showSyncForm" class="space-y-2 max-w-sm" @submit.prevent="handleCreateAccount">
          <Input v-model="syncPass" type="password" :placeholder="t('finding.passphrasePlaceholder')" :aria-label="t('aria.syncPassphrase')" />
          <Input v-model="syncRepeat" type="password" :placeholder="t('finding.passphraseRepeatPlaceholder')" :aria-label="t('aria.repeatPassphrase')" />
          <p v-if="syncStore.error" class="text-xs text-destructive" role="alert">{{ syncStore.error }}</p>
          <Button type="submit" size="sm">{{ t('settings.syncCreateCta') }}</Button>
        </form>
      </template>

      <template v-else-if="!syncStore.unlocked">
        <p class="text-xs text-muted-foreground">{{ t('settings.syncLocked') }}</p>
        <form class="space-y-2 max-w-sm" @submit.prevent="handleUnlock">
          <Input v-model="syncPass" type="password" :placeholder="t('finding.passphraseCurrentPlaceholder')" :aria-label="t('aria.syncPassphrase')" />
          <Button type="submit" size="sm">
            <Icon name="lucide:unlock" class="w-4 h-4 mr-2" />
            {{ t('settings.syncUnlock') }}
          </Button>
        </form>
      </template>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" :disabled="syncStore.syncing" @click="handleSyncNow">
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" :class="{ 'animate-spin': syncStore.syncing }" />
            {{ syncStore.syncing ? 'Sincronizando…' : 'Sincronizar agora' }}
          </Button>
          <Button variant="ghost" size="sm" @click="syncStore.lock()">{{ t('settings.syncLockSession') }}</Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive-soft">{{ t('settings.syncDelete') }}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t('settings.syncDeleteTitle') }}</AlertDialogTitle>
                <AlertDialogDescription>{{ t('settings.syncDeleteDesc') }}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t('action.cancel') }}</AlertDialogCancel>
                <AlertDialogAction @click="syncStore.logout(); toast.success(t('toast.accountDeleted'))">
                  {{ t('settings.syncDelete') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p v-if="syncStore.lastSync" class="text-xs text-muted-foreground">{{ t('settings.lastSync', { date: new Date(syncStore.lastSync).toLocaleString() }) }}</p>
        <p v-if="syncStore.error" class="text-xs text-destructive" role="alert">{{ syncStore.error }}</p>
      </template>
    </Card>

    <!-- Nome de arquivo -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.filename') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('settings.filenameHint') }}</p>
      <Input v-model="filenamePattern" class="max-w-xs font-mono text-sm" :aria-label="t('settings.filenameLabel')" />
    </Card>

    <!-- Export múltiplo -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.exportAll') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('settings.zipHint') }}</p>
      <Button variant="outline" @click="handleExportZip">{{ t('settings.zip') }}</Button>
    </Card>

    <!-- Backup / restauração -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.backup') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('settings.backupHint') }}</p>
      <div class="flex flex-wrap gap-3">
        <Button @click="handleExportAll">{{ t('settings.exportBackup') }}</Button>
        <Button variant="outline" @click="importInput?.click()">{{ t('settings.importBackup') }}</Button>
        <input ref="importInput" type="file" accept="application/json" class="hidden" @change="handleImportAll" />
      </div>
    </Card>

    <!-- v3: JSON Resume (padrão aberto) -->
    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('jsonresume.title') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('jsonresume.desc') }}</p>
      <div class="flex flex-wrap gap-3">
        <Button variant="outline" @click="handleExportJsonResume">
          <Icon name="lucide:file-json" class="w-4 h-4 mr-2" />
          {{ t('jsonresume.export') }}
        </Button>
        <Button variant="outline" @click="jrInput?.click()">
          <Icon name="lucide:upload" class="w-4 h-4 mr-2" />
          {{ t('jsonresume.import') }}
        </Button>
        <input ref="jrInput" type="file" accept="application/json,.json" class="hidden" @change="handleImportJsonResume" />
      </div>
    </Card>

    <!-- v3: criptografia no aparelho -->
    <Card class="p-6 rounded-2xl space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-lg font-bold text-foreground">{{ t('crypto.title') }}</h2>
        <Badge :variant="cryptoOn ? (cryptoUnlocked ? 'success' : 'destructive') : 'sample'" class="text-[10px]">
          {{ cryptoOn ? (cryptoUnlocked ? t('crypto.stateOn') : t('crypto.stateLocked')) : t('crypto.stateOff') }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ t('crypto.hint') }}</p>

      <template v-if="!cryptoOn">
        <Button variant="secondary" size="sm" @click="cryptoTarget = cryptoTarget === 'enable' ? null : 'enable'">
          <Icon name="lucide:lock" class="w-4 h-4 mr-2" />
          {{ t('crypto.enable') }}
        </Button>
        <form v-if="cryptoTarget === 'enable'" class="space-y-2 max-w-sm" @submit.prevent="doEnableCrypto">
          <Input v-model="cryptoPass" type="password" :placeholder="t('crypto.pass')" :aria-label="t('crypto.pass')" />
          <p class="text-xs text-muted-foreground">{{ t('crypto.warn') }}</p>
          <Button type="submit" size="sm">{{ t('crypto.enable') }}</Button>
        </form>
      </template>

      <template v-else-if="!cryptoUnlocked">
        <p class="text-xs text-destructive" role="alert">{{ t('crypto.locked') }}</p>
        <form class="space-y-2 max-w-sm" @submit.prevent="doUnlockCrypto">
          <Input v-model="cryptoPass" type="password" :placeholder="t('crypto.pass')" :aria-label="t('crypto.pass')" />
          <Button type="submit" size="sm">
            <Icon name="lucide:unlock" class="w-4 h-4 mr-2" />
            {{ t('crypto.unlock') }}
          </Button>
        </form>
      </template>

      <div v-else class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" @click="doLockCrypto">{{ t('crypto.lock') }}</Button>
        <Button variant="ghost" size="sm" class="text-destructive" @click="doDisableCrypto">{{ t('crypto.disable') }}</Button>
      </div>
    </Card>

    <!-- v3: conflitos de sincronização -->
    <Card v-if="syncStore.conflicts.length > 0" class="p-6 rounded-2xl space-y-3 border-primary/40">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('sync.conflicts', { n: syncStore.conflicts.length }) }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('sync.conflictHint') }}</p>
      <div class="divide-y divide-border-soft">
        <div v-for="c in syncStore.conflicts" :key="c.docId" class="py-3 space-y-2">
          <div class="font-semibold text-sm text-foreground">{{ c.local.title }}</div>
          <div class="text-[11px] text-muted-foreground">
            {{ new Date(c.local.updatedAt).toLocaleString('pt-BR') }} · v{{ c.local.version }}
            ↔
            {{ new Date(c.remote.updatedAt).toLocaleString('pt-BR') }} · v{{ c.remote.version }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" @click="resolveConflict(c.docId, 'local')">{{ t('sync.keepLocal') }}</Button>
            <Button variant="outline" size="sm" @click="resolveConflict(c.docId, 'remote')">{{ t('sync.keepRemote') }}</Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- v3: links criados neste aparelho -->
    <Card v-if="shares.length > 0" class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('shares.title') }}</h2>
      <div class="divide-y divide-border-soft">
        <div v-for="s in shares" :key="s.id + s.createdAt" class="flex flex-wrap items-center gap-2 py-2 text-xs">
          <Badge :variant="s.kind === 'publish' ? 'success' : 'sample'" class="text-[10px]">
            {{ s.kind === 'publish' ? t('publish.done') : t('short.title') }}
          </Badge>
          <span class="flex-1 min-w-[140px] truncate">{{ s.title }}</span>
          <a :href="s.url" target="_blank" rel="noopener noreferrer" class="text-secondary underline truncate max-w-[220px]">{{ s.url }}</a>
          <Button variant="ghost" size="sm" class="h-7 text-[11px]" @click="dropShare(s.id)">{{ t('action.close') }}</Button>
        </div>
      </div>
    </Card>
    <!-- Zona de perigo -->
    <Card class="p-6 rounded-2xl space-y-3 border-destructive-soft">
      <h2 class="font-display text-lg font-bold text-destructive">{{ t('settings.wipe') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('settings.wipeDesc') }}</p>
      <Button variant="destructive" @click="showWipe = true">{{ t('settings.wipeCta') }}</Button>
    </Card>

    <!-- Lista de exports rápidos -->
    <Card v-if="docs.length > 0" class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('settings.quickExport') }}</h2>
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
          <AlertDialogTitle>{{ t('settings.wipeTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('settings.wipeBody', { word: t('settings.wipePlaceholder') }) }}</AlertDialogDescription>
        </AlertDialogHeader>
        <Input v-model="confirmWipe" :placeholder="wipeWord" class="max-w-[200px]" />
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('action.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive-soft text-destructive hover:bg-destructive/20"
            :disabled="confirmWipe !== wipeWord"
            @click="handleWipe"
          >
            {{ t('settings.wipeConfirmCta') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
