export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@vite-pwa/nuxt',
  ],

  icon: {
    // clientBundle embute no JS os ícones usados — sem fetch ao
    // /api/_nuxt_icon (inexistente em host estático) nem ao
    // api.iconify.design (quebra offline). scan cobre .vue; os .ts
    // (useSectionOrder) entram pela lista `icons`
    clientBundle: {
      scan: true,
      icons: [
        'lucide:user', 'lucide:briefcase', 'lucide:graduation-cap', 'lucide:star',
        'lucide:link', 'lucide:folder-git-2', 'lucide:award', 'lucide:languages',
        'lucide:heart-handshake',
      ],
      sizeLimitKb: 512,
    },
    fallbackToApi: false,
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: true,
    config: {
      darkMode: ['class'],
    },
  },

  imports: {
    dirs: ['~/composables', '~/lib'],
  },

  components: [
    // ignore: os index.ts de ui/ reexportam o componente da pasta — sem
    // isso o Nuxt os registra também como "componente", gerando warnings
    // de nome duplicado (UiButton, UiCard, ...) no build
    { path: '~/components/ui', prefix: 'Ui', ignore: ['**/index.ts'] },
    '~/components',
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'HireWerk',
      short_name: 'HireWerk',
      description: 'Crie currículos profissionais',
      theme_color: '#ffd02f',
      display: 'standalone',
      orientation: 'portrait',
      // Atalhos de ícone pressionado (F8 #85)
      shortcuts: [
        {
          name: 'Novo currículo',
          short_name: 'Novo',
          description: 'Criar um currículo do zero',
          url: '/resumes?new=1',
        },
        {
          name: 'Meus currículos',
          short_name: 'Currículos',
          description: 'Ver e gerenciar currículos',
          url: '/resumes',
        },
      ],
      // Receber PDFs compartilhados de outros apps (F8 #84)
      share_target: {
        action: '/resumes',
        method: 'GET',
        params: { title: 'title', text: 'text', url: 'url' },
      },
      icons: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'HireWerk',
      script: [
        {
          // Aplica o tema salvo antes da primeira pintura (evita flash de tema claro)
          innerHTML: `(function(){try{var t=localStorage.getItem('hirewerk-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=t}catch(e){}})()`,
          tagPosition: 'head',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Noto+Sans:wght@400;500;600;700&display=swap' }
      ]
    }
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  ssr: false,

  compatibilityDate: '2026-01-01',
})
