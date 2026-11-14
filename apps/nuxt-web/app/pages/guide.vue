<script setup lang="ts">
/**
 * Como usar — tutoriais por tarefa.
 *
 * Conteúdo bilíngue como estrutura de dados (mesmo padrão de `privacy.vue`):
 * o texto muda inteiro com o idioma, e uma lista de passos numerados lê melhor
 * no código do que dezenas de chaves soltas em i18n.ts.
 */
import { computed } from 'vue'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useI18n } from '~/composables/useI18n'

const { t, locale } = useI18n()

interface Step {
  title: string
  body: string
}

interface Tutorial {
  id: string
  icon: string
  title: string
  summary: string
  steps: Step[]
  tip?: string
  cta?: { label: string; to: string }
}

const PT: { title: string; intro: string; toc: string; shortcuts: string; shortcutsList: { keys: string; label: string }[]; tutorials: Tutorial[]; faqTitle: string; faq: Step[]; back: string; privacy: string } = {
  title: 'Como usar o HireWerk',
  intro:
    'Tutoriais curtos, um por tarefa. Tudo roda no seu navegador: nada é enviado a servidor nenhum, e você pode fechar a aba e voltar depois — seus currículos continuam aqui.',
  toc: 'Ir para',
  shortcuts: 'Atalhos de teclado',
  shortcutsList: [
    { keys: 'Ctrl + K', label: 'Abrir a paleta de comandos' },
    { keys: '?', label: 'Ver todos os atalhos' },
    { keys: 'Ctrl + S', label: 'Salvar agora (no editor)' },
    { keys: 'Ctrl + Z', label: 'Desfazer' },
    { keys: 'Ctrl + Y', label: 'Refazer' },
    { keys: 'Ctrl + F', label: 'Buscar e substituir (no editor)' },
    { keys: 'Esc', label: 'Fechar o painel aberto' },
  ],
  tutorials: [
    {
      id: 'primeiro-curriculo',
      icon: 'lucide:file-plus',
      title: 'Criar seu primeiro currículo',
      summary: 'Do zero ao PDF em três passos.',
      steps: [
        {
          title: 'Abra a lista de currículos',
          body: 'Clique em “Currículos” na barra de cima e depois em “Novo currículo”. O editor abre com um documento em branco já salvo no seu aparelho.',
        },
        {
          title: 'Preencha os dados pessoais',
          body: 'Nome, título profissional, resumo e contato. O campo de resumo tem um contador de palavras: 40 ou mais melhora bastante a leitura por sistemas ATS.',
        },
        {
          title: 'Adicione experiência e formação',
          body: 'Cada seção abre e fecha clicando no título. Use “Adicionar Experiência” e preencha cargo, empresa, período e descrição. Descreva resultados com números — “reduzi o tempo de onboarding em 40%” vale mais que “responsável por onboarding”.',
        },
        {
          title: 'Escolha um modelo e baixe o PDF',
          body: 'Clique em “Modelo” para trocar o visual, ajuste cor/fonte/densidade no painel de estilo à direita, e clique em “Baixar PDF”. O PDF sai limpo: só a folha, sem menus nem botões.',
        },
      ],
      tip: 'O indicador “% completo” no topo conta o que ainda falta. Passe o mouse para ver a lista.',
      cta: { label: 'Criar um currículo', to: '/resumes' },
    },
    {
      id: 'ats',
      icon: 'lucide:target',
      title: 'Adaptar o currículo a uma vaga',
      summary: 'Descubra o que a vaga pede e o que falta no seu currículo.',
      steps: [
        {
          title: 'Abra “Compatibilidade”',
          body: 'No editor, clique em “Compatibilidade” na barra de ferramentas. Cole a descrição completa da vaga no campo.',
        },
        {
          title: 'Leia o score e as palavras que faltam',
          body: 'A análise roda no seu aparelho em tempo real. Ela mostra a porcentagem de cobertura das palavras-chave da vaga e lista em “Palavras-chave que faltam” os termos ausentes do currículo.',
        },
        {
          title: 'Aplique as sugestões',
          body: 'Abaixo do score aparecem sugestões aplicáveis com um clique: adicionar uma habilidade citada pela vaga, mover para o topo as habilidades que ela repete, ou citar a vaga no resumo. Nada é inventado — as sugestões saem do que a vaga pede e do que você já escreveu.',
        },
        {
          title: 'Salve a análise',
          body: '“Salvar análise” guarda o resultado no histórico do currículo. Assim você compara versões diferentes do mesmo currículo para a mesma vaga.',
        },
      ],
      tip: 'Se você tem a experiência que a vaga pede, escreva com as mesmas palavras dela. ATS procura termos, não sinônimos.',
    },
    {
      id: 'versao-por-vaga',
      icon: 'lucide:copy-plus',
      title: 'Fazer uma versão para cada vaga',
      summary: 'Uma cópia por candidatura, sem bagunçar o currículo principal.',
      steps: [
        {
          title: 'Duplique com “Para vaga”',
          body: 'No editor, clique em “Para vaga”. Dê um nome que identifique a candidatura (ex.: “Dev Sênior na Acme”) e o app cria uma cópia completa.',
        },
        {
          title: 'Ajuste só a cópia',
          body: 'Edite resumo, habilidades e ordem das seções nessa cópia. O currículo original fica intacto.',
        },
        {
          title: 'Rastreie no tracker',
          body: 'Registre a candidatura em “Candidaturas”: empresa, vaga, status e data de follow-up. O painel avisa quando um follow-up vence.',
        },
      ],
      tip: 'Use tags na lista de currículos (“frontend”, “remoto”) para filtrar depois.',
      cta: { label: 'Abrir o tracker', to: '/applications' },
    },
    {
      id: 'carta',
      icon: 'lucide:mail-plus',
      title: 'Escrever uma carta de apresentação',
      summary: 'Um documento à parte, com rascunho gerado localmente.',
      steps: [
        {
          title: 'Crie a carta',
          body: 'Na lista de currículos, clique em “Nova carta” — ou, no editor de um currículo, em “Criar carta” para aproveitar os dados já preenchidos.',
        },
        {
          title: 'Preencha empresa, vaga e tom',
          body: 'No painel de carta, informe a empresa e a vaga. Escolha o tom: formal, direto ou caloroso.',
        },
        {
          title: 'Gere o rascunho e edite',
          body: '“Gerar rascunho” monta um texto a partir do seu currículo e da vaga — localmente, sem IA na nuvem. Revise e ajuste com as suas palavras: o rascunho é ponto de partida, não texto final.',
        },
      ],
      tip: 'A contagem de palavras no topo do painel ajuda a manter a carta em uma página.',
    },
    {
      id: 'versoes',
      icon: 'lucide:history',
      title: 'Voltar a uma versão anterior',
      summary: 'Histórico automático, diff campo a campo e restauração.',
      steps: [
        {
          title: 'Abra “Versões”',
          body: 'Cada save cria um snapshot (até 30 por currículo) e o primeiro save do dia ganha um marcador de data.',
        },
        {
          title: 'Compare com a versão atual',
          body: '“Comparar com a atual” mostra um diff por campo — “Nome: Ana Costa → Ana Costa Silva” — em vez de um despejo de JSON.',
        },
        {
          title: 'Restaure ou renomeie',
          body: '“Restaurar” aplica a versão escolhida; a versão que estava aberta vai para o Refazer, então nada é perdido. “Renomear” dá um nome ao snapshot (ex.: “versão enviada para a Acme”).',
        },
      ],
      tip: 'Ctrl+Z / Ctrl+Y desfazem e refazem edições isoladas; o histórico é para voltar a um estado inteiro.',
    },
    {
      id: 'compartilhar',
      icon: 'lucide:share-2',
      title: 'Compartilhar sem servidor',
      summary: 'Link simples, link com senha, QR e envio por e-mail.',
      steps: [
        {
          title: 'Abra “Compartilhar”',
          body: 'O link carrega o currículo inteiro dentro dele mesmo — nada é armazenado em servidor. Quem abrir vê a versão que você gerou naquele momento.',
        },
        {
          title: 'Proteja com senha',
          body: '“Com senha” cifra o conteúdo no seu navegador (AES-GCM) e embute o resultado no link. Quem abrir precisa digitar a senha.',
        },
        {
          title: 'Defina expiração',
          body: '“Expira em” limita a validade a 7 ou 30 dias. Depois disso o link recusa abrir.',
        },
        {
          title: 'Envie do jeito que precisar',
          body: '“Copiar link”, “Por e-mail” (abre seu cliente), “Como texto” (o currículo formatado no clipboard) ou “Como arquivo” (share sheet do sistema no celular).',
        },
      ],
      tip: 'Links longos não geram QR. Se precisar de QR, use o link simples sem senha e sem expiração.',
    },
    {
      id: 'backup',
      icon: 'lucide:hard-drive-download',
      title: 'Fazer backup e levar para outro aparelho',
      summary: 'Exportar tudo, importar de volta, interoperar com JSON Resume.',
      steps: [
        {
          title: 'Exporte o backup completo',
          body: 'Em Configurações → “Backup completo” → “Exportar backup”. O arquivo JSON tem todos os currículos, versões e configurações.',
        },
        {
          title: 'Restaure em outro aparelho',
          body: 'No outro navegador, abra Configurações → “Importar backup” e escolha o arquivo. Os currículos existentes são preservados; os do backup são adicionados.',
        },
        {
          title: 'Interopere com outros apps',
          body: '“JSON Resume” exporta no padrão aberto do jsonresume.org, aceito por vários sites de emprego. O import também funciona: um arquivo JSON Resume vira um currículo.',
        },
      ],
      tip: 'O backup é texto puro. Se você usa criptografia no aparelho, o arquivo exportado não é cifrado — guarde-o com cuidado.',
      cta: { label: 'Abrir Configurações', to: '/settings' },
    },
    {
      id: 'sincronizar',
      icon: 'lucide:refresh-cw',
      title: 'Sincronizar entre aparelhos',
      summary: 'Opcional, criptografado de ponta a ponta.',
      steps: [
        {
          title: 'Crie uma conta de sincronização',
          body: 'Configurações → “Sincronizar entre aparelhos” → “Criar conta”. Escolha uma frase-senha de pelo menos 8 caracteres.',
        },
        {
          title: 'Entenda o que o servidor vê',
          body: 'Seus currículos são cifrados no aparelho antes de sair dele. O servidor guarda apenas blobs opacos: identificador de conta, timestamps e o conteúdo cifrado. Ele não consegue lê-los.',
        },
        {
          title: 'Destrave no outro aparelho',
          body: 'No segundo aparelho, informe o mesmo identificador de conta e a mesma frase-senha. A chave é derivada da frase-senha; ela nunca sai do dispositivo.',
        },
        {
          title: 'Resolva conflitos com calma',
          body: 'Se você editar o mesmo currículo nos dois aparelhos offline, o app mostra um conflito em vez de sobrescrever. Escolha qual versão manter — a outra não é apagada do histórico.',
        },
      ],
      tip: 'Não há recuperação de frase-senha. Se perder, os blobs cifrados ficam ilegíveis para sempre. Anote em lugar seguro.',
    },
    {
      id: 'criptografia',
      icon: 'lucide:lock',
      title: 'Proteger os dados no aparelho',
      summary: 'Criptografia em repouso, opcional.',
      steps: [
        {
          title: 'Ative em Configurações',
          body: '“Criptografia no aparelho” → “Ativar criptografia”. Escolha a frase-senha. A partir daí, os currículos ficam cifrados no localStorage (AES-GCM, chave derivada com PBKDF2).',
        },
        {
          title: 'Destrave ao abrir',
          body: 'Ao voltar ao app depois de fechar o navegador, informe a frase-senha. Sem ela, os currículos não são legíveis nem pelo próprio app.',
        },
        {
          title: 'Desative com segurança',
          body: '“Desativar” decifra todos os documentos antes de remover a chave. Se algum documento não puder ser decifrado, a desativação é bloqueada para você não perder dados.',
        },
      ],
      tip: 'A criptografia protege contra alguém com acesso ao seu navegador. Não substitui o backup — faça um antes de ativar.',
    },
    {
      id: 'publicar',
      icon: 'lucide:globe',
      title: 'Publicar uma página pública',
      summary: 'Um link permanente e revogável, com contador de aberturas.',
      steps: [
        {
          title: 'Publique pelo editor',
          body: 'Clique em “Publicar página pública”. Isso exige uma conta de sincronização — é o que permite revogar depois.',
        },
        {
          title: 'Escolha a validade',
          body: 'A publicação pode expirar em 7 ou 30 dias, ou ficar no ar até você revogar.',
        },
        {
          title: 'Acompanhe e revogue',
          body: 'Em Configurações você vê as publicações criadas neste aparelho, o contador agregado de aberturas (sem IP, sem identificação) e o botão de revogar.',
        },
      ],
      tip: 'Publicar coloca o conteúdo no servidor em texto puro — o objetivo é ser lido. Publique só o que pode ser público.',
    },
    {
      id: 'importar',
      icon: 'lucide:file-up',
      title: 'Importar um currículo existente',
      summary: 'PDF e LinkedIn, convertidos localmente.',
      steps: [
        {
          title: 'Abra “Importar” no editor',
          body: 'Escolha PDF ou LinkedIn. O arquivo é processado no seu navegador — o PDF não sai do aparelho.',
        },
        {
          title: 'Revise o que foi extraído',
          body: 'A extração de PDF é heurística: nomes de seção variam muito. Confira cada campo e complete o que faltar.',
        },
        {
          title: 'Para LinkedIn, exporte antes',
          body: 'No LinkedIn: “Dados e privacidade” → “Obter uma cópia dos seus dados”. Envie o ZIP baixado.',
        },
      ],
      tip: 'Importar de PDF funciona melhor com currículos de uma coluna. Layouts em duas colunas podem embaralhar a ordem.',
    },
  ],
  faqTitle: 'Perguntas frequentes',
  faq: [
    {
      title: 'Meus dados vão para algum servidor?',
      body: 'Não, por padrão. O app funciona 100% offline: currículos, versões e candidaturas ficam no localStorage do seu navegador. Só há tráfego se você ativar sync, encurtar um link ou publicar uma página — e nesses casos o conteúdo vai cifrado (sync) ou é uma escolha explícita sua (publicação).',
    },
    {
      title: 'Troquei de navegador e perdi tudo. Dá para recuperar?',
      body: 'O localStorage é por navegador e por perfil — não é compartilhado. Para levar os dados, use o backup JSON em Configurações ou o sync entre aparelhos. Se você limpou os dados do navegador sem backup, não há como recuperar.',
    },
    {
      title: 'O PDF saiu diferente da tela',
      body: 'O PDF usa o diálogo de impressão do navegador. Escolha “Salvar como PDF”, margens “Nenhuma” e desmarque “Cabeçalhos e rodapés” para o resultado bater com a prévia. Use também o papel certo (A4 ou Letter) no painel de estilo.',
    },
    {
      title: 'Esqueci a frase-senha',
      body: 'Não há recuperação — é o que garante que ninguém além de você leia os dados. Se você tiver um backup exportado antes de ativar a criptografia, pode restaurá-lo. Caso contrário, os documentos cifrados ficam inacessíveis.',
    },
    {
      title: 'Funciona no celular?',
      body: 'Sim. O editor vira abas (Editor / Preview) em telas pequenas, e dá para instalar como app pela opção “Adicionar à tela inicial” do navegador. No Android, o app também aparece no menu de compartilhamento para receber arquivos.',
    },
    {
      title: 'Preciso de internet?',
      body: 'Só para a primeira visita. Depois disso o app funciona offline (é um PWA com service worker). Sync, encurtador e publicação são as únicas funções que precisam de rede.',
    },
  ],
  back: '← Voltar ao início',
  privacy: 'Política de privacidade',
}

const EN: typeof PT = {
  title: 'How to use HireWerk',
  intro:
    'Short tutorials, one per task. Everything runs in your browser: nothing is sent to any server, and you can close the tab and come back later — your résumés stay here.',
  toc: 'Jump to',
  shortcuts: 'Keyboard shortcuts',
  shortcutsList: [
    { keys: 'Ctrl + K', label: 'Open the command palette' },
    { keys: '?', label: 'Show every shortcut' },
    { keys: 'Ctrl + S', label: 'Save now (in the editor)' },
    { keys: 'Ctrl + Z', label: 'Undo' },
    { keys: 'Ctrl + Y', label: 'Redo' },
    { keys: 'Ctrl + F', label: 'Find and replace (in the editor)' },
    { keys: 'Esc', label: 'Close the open panel' },
  ],
  tutorials: [
    {
      id: 'first-resume',
      icon: 'lucide:file-plus',
      title: 'Create your first résumé',
      summary: 'From blank to PDF in three steps.',
      steps: [
        {
          title: 'Open the résumé list',
          body: 'Click “Résumés” in the top bar, then “New résumé”. The editor opens with a blank document already saved on your device.',
        },
        {
          title: 'Fill in your details',
          body: 'Name, professional title, summary and contact. The summary field has a word counter: 40 or more words reads much better for ATS systems.',
        },
        {
          title: 'Add experience and education',
          body: 'Each section opens and closes when you click its title. Use “Add experience” and fill in role, company, period and description. Describe results with numbers — “cut onboarding time by 40%” beats “responsible for onboarding”.',
        },
        {
          title: 'Pick a template and download the PDF',
          body: 'Click “Template” to change the look, adjust color/font/density in the style panel on the right, then click “Download PDF”. The PDF comes out clean: just the sheet, no menus or buttons.',
        },
      ],
      tip: 'The “% complete” indicator at the top counts what is still missing. Hover it for the list.',
      cta: { label: 'Create a résumé', to: '/resumes' },
    },
    {
      id: 'ats',
      icon: 'lucide:target',
      title: 'Tailor your résumé to a job',
      summary: 'See what the job asks for and what your résumé is missing.',
      steps: [
        {
          title: 'Open “Job match”',
          body: 'In the editor, click “Job match” in the toolbar. Paste the full job description into the field.',
        },
        {
          title: 'Read the score and the missing keywords',
          body: 'Analysis runs on your device in real time. It shows the percentage of the job keywords your résumé covers and lists the missing terms under “Missing keywords”.',
        },
        {
          title: 'Apply the suggestions',
          body: 'Below the score you get one-click suggestions: add a skill the job mentions, move the skills it repeats to the top, or cite the job in your summary. Nothing is invented — suggestions come from the job description and what you already wrote.',
        },
        {
          title: 'Save the analysis',
          body: '“Save analysis” stores the result in the résumé history, so you can compare different versions of the same résumé for the same job.',
        },
      ],
      tip: 'If you have the experience the job asks for, use its exact words. ATS looks for terms, not synonyms.',
    },
    {
      id: 'version-per-job',
      icon: 'lucide:copy-plus',
      title: 'Make one version per job',
      summary: 'A copy per application, without cluttering your main résumé.',
      steps: [
        {
          title: 'Duplicate with “For job”',
          body: 'In the editor, click “For job”. Name it after the application (e.g. “Senior Dev at Acme”) and the app creates a full copy.',
        },
        {
          title: 'Edit only the copy',
          body: 'Adjust summary, skills and section order in that copy. Your original résumé stays untouched.',
        },
        {
          title: 'Track it',
          body: 'Record the application under “Applications”: company, role, status and follow-up date. The dashboard warns you when a follow-up is due.',
        },
      ],
      tip: 'Use tags in the résumé list (“frontend”, “remote”) to filter later.',
      cta: { label: 'Open the tracker', to: '/applications' },
    },
    {
      id: 'cover-letter',
      icon: 'lucide:mail-plus',
      title: 'Write a cover letter',
      summary: 'A separate document, with a locally generated draft.',
      steps: [
        {
          title: 'Create the letter',
          body: 'In the résumé list, click “New letter” — or, in a résumé editor, “Create letter” to reuse the details you already filled in.',
        },
        {
          title: 'Fill in company, role and tone',
          body: 'In the letter panel, enter the company and the role. Choose the tone: formal, direct or warm.',
        },
        {
          title: 'Generate the draft and edit it',
          body: '“Generate draft” builds a text from your résumé and the job — locally, with no cloud AI. Review and adjust in your own words: the draft is a starting point, not final copy.',
        },
      ],
      tip: 'The word count at the top of the panel helps keep the letter to one page.',
    },
    {
      id: 'versions',
      icon: 'lucide:history',
      title: 'Go back to an earlier version',
      summary: 'Automatic history, field-by-field diff and restore.',
      steps: [
        {
          title: 'Open “Versions”',
          body: 'Every save creates a snapshot (up to 30 per résumé), and the first save of each day gets a date marker.',
        },
        {
          title: 'Compare with the current one',
          body: '“Compare with current” shows a per-field diff — “Name: Ana Costa → Ana Costa Silva” — instead of a JSON dump.',
        },
        {
          title: 'Restore or rename',
          body: '“Restore” applies the chosen version; whatever was open goes to Redo, so nothing is lost. “Rename” labels the snapshot (e.g. “version sent to Acme”).',
        },
      ],
      tip: 'Ctrl+Z / Ctrl+Y undo and redo isolated edits; the history is for going back to a whole state.',
    },
    {
      id: 'share',
      icon: 'lucide:share-2',
      title: 'Share without a server',
      summary: 'Plain link, password link, QR and email.',
      steps: [
        {
          title: 'Open “Share”',
          body: 'The link carries the whole résumé inside itself — nothing is stored on a server. Whoever opens it sees the version you generated at that moment.',
        },
        {
          title: 'Protect it with a password',
          body: '“With password” encrypts the content in your browser (AES-GCM) and embeds the result in the link. Whoever opens it must type the password.',
        },
        {
          title: 'Set an expiry',
          body: '“Expires in” limits validity to 7 or 30 days. After that the link refuses to open.',
        },
        {
          title: 'Send it the way you need',
          body: '“Copy link”, “By e-mail” (opens your client), “As text” (formatted résumé on the clipboard) or “As file” (the system share sheet on mobile).',
        },
      ],
      tip: 'Long links do not produce a QR. If you need one, use a plain link with no password and no expiry.',
    },
    {
      id: 'backup',
      icon: 'lucide:hard-drive-download',
      title: 'Back up and move to another device',
      summary: 'Export everything, import it back, interoperate with JSON Resume.',
      steps: [
        {
          title: 'Export the full backup',
          body: 'Settings → “Full backup” → “Export backup”. The JSON file holds every résumé, version and setting.',
        },
        {
          title: 'Restore on another device',
          body: 'In the other browser, open Settings → “Import backup” and pick the file. Existing résumés are preserved; the ones from the backup are added.',
        },
        {
          title: 'Interoperate with other apps',
          body: '“JSON Resume” exports to the open jsonresume.org standard, accepted by many job sites. Import works too: a JSON Resume file becomes a résumé.',
        },
      ],
      tip: 'The backup is plain text. If you use on-device encryption, the exported file is not encrypted — store it carefully.',
      cta: { label: 'Open Settings', to: '/settings' },
    },
    {
      id: 'sync',
      icon: 'lucide:refresh-cw',
      title: 'Sync across devices',
      summary: 'Optional, end-to-end encrypted.',
      steps: [
        {
          title: 'Create a sync account',
          body: 'Settings → “Sync across devices” → “Create sync account”. Choose a passphrase of at least 8 characters.',
        },
        {
          title: 'Understand what the server sees',
          body: 'Your résumés are encrypted on the device before leaving it. The server stores only opaque blobs: an account identifier, timestamps and the ciphertext. It cannot read them.',
        },
        {
          title: 'Unlock on the second device',
          body: 'On the other device, enter the same account identifier and the same passphrase. The key is derived from the passphrase; it never leaves the device.',
        },
        {
          title: 'Resolve conflicts calmly',
          body: 'If you edit the same résumé on both devices offline, the app shows a conflict instead of overwriting. Pick which version to keep — the other is not erased from history.',
        },
      ],
      tip: 'There is no passphrase recovery. If you lose it, the encrypted blobs stay unreadable forever. Write it down somewhere safe.',
    },
    {
      id: 'encryption',
      icon: 'lucide:lock',
      title: 'Protect the data on your device',
      summary: 'At-rest encryption, optional.',
      steps: [
        {
          title: 'Turn it on in Settings',
          body: '“On-device encryption” → “Enable encryption”. Choose the passphrase. From then on, résumés are encrypted in localStorage (AES-GCM, key derived with PBKDF2).',
        },
        {
          title: 'Unlock when you come back',
          body: 'When you return to the app after closing the browser, enter the passphrase. Without it, the résumés are not readable even by the app itself.',
        },
        {
          title: 'Disable it safely',
          body: '“Disable” decrypts every document before removing the key. If any document cannot be decrypted, disabling is blocked so you do not lose data.',
        },
      ],
      tip: 'Encryption protects against someone with access to your browser. It is not a backup — make one first.',
    },
    {
      id: 'publish',
      icon: 'lucide:globe',
      title: 'Publish a public page',
      summary: 'A permanent, revocable link with an open counter.',
      steps: [
        {
          title: 'Publish from the editor',
          body: 'Click “Publish public page”. This requires a sync account — that is what makes revocation possible.',
        },
        {
          title: 'Choose the validity',
          body: 'A publication can expire in 7 or 30 days, or stay up until you revoke it.',
        },
        {
          title: 'Monitor and revoke',
          body: 'Under Settings you see the publications created on this device, the aggregate open counter (no IP, no identification) and the revoke button.',
        },
      ],
      tip: 'Publishing puts the content on the server in plain text — the point is to be read. Publish only what can be public.',
    },
    {
      id: 'import',
      icon: 'lucide:file-up',
      title: 'Import an existing résumé',
      summary: 'PDF and LinkedIn, converted locally.',
      steps: [
        {
          title: 'Open “Import” in the editor',
          body: 'Choose PDF or LinkedIn. The file is processed in your browser — the PDF never leaves the device.',
        },
        {
          title: 'Review what was extracted',
          body: 'PDF extraction is heuristic: section names vary a lot. Check every field and fill in what is missing.',
        },
        {
          title: 'For LinkedIn, export first',
          body: 'On LinkedIn: “Data privacy” → “Get a copy of your data”. Upload the ZIP you downloaded.',
        },
      ],
      tip: 'Importing from PDF works best with single-column résumés. Two-column layouts may scramble the order.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faq: [
    {
      title: 'Does my data go to a server?',
      body: 'No, by default. The app runs 100% offline: résumés, versions and applications live in your browser localStorage. There is traffic only if you enable sync, shorten a link or publish a page — and in those cases the content is encrypted (sync) or is an explicit choice of yours (publishing).',
    },
    {
      title: 'I switched browsers and lost everything. Can I recover it?',
      body: 'localStorage is per browser and per profile — it is not shared. To move data, use the JSON backup in Settings or cross-device sync. If you cleared your browser data without a backup, there is no recovery.',
    },
    {
      title: 'The PDF came out different from the screen',
      body: 'The PDF uses the browser print dialog. Choose “Save as PDF”, margins “None” and uncheck “Headers and footers” so the result matches the preview. Also pick the right paper (A4 or Letter) in the style panel.',
    },
    {
      title: 'I forgot the passphrase',
      body: 'There is no recovery — that is what guarantees nobody but you can read the data. If you exported a backup before enabling encryption, you can restore it. Otherwise the encrypted documents stay inaccessible.',
    },
    {
      title: 'Does it work on a phone?',
      body: 'Yes. The editor becomes tabs (Editor / Preview) on small screens, and you can install it as an app via the browser\u2019s “Add to home screen”. On Android the app also appears in the share menu to receive files.',
    },
    {
      title: 'Do I need internet?',
      body: 'Only for the first visit. After that the app works offline (it is a PWA with a service worker). Sync, the shortener and publishing are the only features that need a network.',
    },
  ],
  back: '← Back to home',
  privacy: 'Privacy policy',
}

const copy = computed(() => (locale.value === 'en-US' ? EN : PT))

useSeoMeta({
  title: () => (locale.value === 'en-US' ? 'How to use — HireWerk' : 'Como usar — HireWerk'),
  description: () =>
    locale.value === 'en-US'
      ? 'Step-by-step tutorials for HireWerk: first résumé, ATS tailoring, versions, sharing, backup, sync and encryption.'
      : 'Tutoriais passo a passo do HireWerk: primeiro currículo, tailoring ATS, versões, compartilhamento, backup, sync e criptografia.',
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16 grid gap-10">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">{{ copy.title }}</h1>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">{{ copy.intro }}</p>
    </div>

    <!-- Índice -->
    <nav :aria-label="copy.toc" class="rounded-2xl border border-border-soft bg-card p-5">
      <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{{ copy.toc }}</p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="tutorial in copy.tutorials" :key="tutorial.id">
          <a :href="`#${tutorial.id}`" class="flex items-start gap-2 text-sm text-secondary hover:underline">
            <Icon :name="tutorial.icon" class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {{ tutorial.title }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Atalhos -->
    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">{{ copy.shortcuts }}</h2>
      <dl class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="shortcut in copy.shortcutsList"
          :key="shortcut.keys"
          class="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-card px-3 py-2"
        >
          <dt class="text-sm text-muted-foreground">{{ shortcut.label }}</dt>
          <dd class="shrink-0">
            <kbd class="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-foreground">{{ shortcut.keys }}</kbd>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Tutoriais -->
    <section v-for="(tutorial, ti) in copy.tutorials" :id="tutorial.id" :key="tutorial.id" class="space-y-4 scroll-mt-24">
      <div class="flex items-start gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon :name="tutorial.icon" class="w-5 h-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h2 class="font-display text-xl font-bold text-foreground">
            <span class="text-muted-foreground tabular-nums">{{ ti + 1 }}.</span>
            {{ tutorial.title }}
          </h2>
          <p class="text-sm text-muted-foreground">{{ tutorial.summary }}</p>
        </div>
      </div>

      <ol class="grid gap-3 pl-1">
        <li v-for="(step, si) in tutorial.steps" :key="si" class="flex gap-3">
          <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-card text-[11px] font-bold text-muted-foreground tabular-nums">
            {{ si + 1 }}
          </span>
          <div class="min-w-0 space-y-1">
            <p class="text-sm font-semibold text-foreground">{{ step.title }}</p>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ step.body }}</p>
          </div>
        </li>
      </ol>

      <p v-if="tutorial.tip" class="flex gap-2 rounded-xl border border-warning-soft bg-warning-soft/30 p-3 text-sm text-muted-foreground">
        <Icon name="lucide:lightbulb" class="w-4 h-4 shrink-0 mt-0.5 text-warning" aria-hidden="true" />
        <span>{{ tutorial.tip }}</span>
      </p>

      <Button v-if="tutorial.cta" variant="outline" size="sm" as-child>
        <NuxtLink :to="tutorial.cta.to">{{ tutorial.cta.label }}</NuxtLink>
      </Button>
    </section>

    <!-- FAQ -->
    <section class="space-y-4">
      <h2 class="font-display text-xl font-bold text-foreground">{{ copy.faqTitle }}</h2>
      <Card v-for="(item, i) in copy.faq" :key="i" class="p-5 rounded-2xl space-y-2">
        <h3 class="font-display text-base font-bold text-foreground">{{ item.title }}</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">{{ item.body }}</p>
      </Card>
    </section>

    <div class="flex flex-wrap gap-3 pt-4">
      <Button variant="outline" as-child>
        <NuxtLink to="/">{{ copy.back }}</NuxtLink>
      </Button>
      <Button variant="ghost" as-child>
        <NuxtLink to="/privacy">{{ copy.privacy }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
