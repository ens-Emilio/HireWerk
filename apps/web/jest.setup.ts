// Aumenta timeout padrão para operações que podem demorar um pouco (ex.: mocks async)
jest.setTimeout(30000);

// Variáveis públicas mínimas para evitar erros em imports que leem env
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'dummy';
// Segredo para assinar tokens de export (usado pela rota de PDF)
process.env.EXPORT_TOKEN_SECRET ||= 'testsecret';

// Polyfill de ReadableStream para ambiente Node nos testes
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webStreams = require('node:stream/web');
  if (typeof globalThis.ReadableStream === 'undefined' && webStreams?.ReadableStream) {
    // @ts-ignore
    globalThis.ReadableStream = webStreams.ReadableStream;
  }
} catch {}
