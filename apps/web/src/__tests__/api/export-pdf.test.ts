export {};

// Mocks globais de dependências pesadas
let __supabaseMock: any;

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => __supabaseMock,
}));

jest.mock('@sparticuz/chromium', () => ({
  __esModule: true,
  default: {
    executablePath: jest.fn(async () => 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
    args: [],
    defaultViewport: { width: 1024, height: 768 },
  },
}));

jest.mock('puppeteer-core', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(async (options: any) => {
      // Ignorar verificação do caminho do executável
      console.log('[TEST] Puppeteer mock launch chamado com:', { executablePath: options?.executablePath });
      return {
        newPage: jest.fn(async () => ({
          goto: jest.fn(async () => {}),
          emulateMediaType: jest.fn(async () => {}),
          addStyleTag: jest.fn(async () => {}),
          evaluate: jest.fn(async () => {}),
          pdf: jest.fn(async () => Buffer.from('%PDF-1.7 mock pdf%')),
        })),
        close: jest.fn(async () => {}),
      };
    }),
  },
}));

// Mock do fs para resolver executável (overridável por teste)
jest.mock('node:fs', () => {
  const statSync = jest.fn((p: string) => ({
    isFile: () => /\\|\//.test(p) && p.toLowerCase().endsWith('.exe'),
    isDirectory: () => !p.toLowerCase().endsWith('.exe'),
  }));
  const existsSync = jest.fn((_p: string) => false);
  return { __esModule: true, statSync, existsSync };
});

function makeSupabase({ authUser, resumeRow }: { authUser: { id: string } | null; resumeRow?: any }) {
  const tables: Record<string, any> = {
    resumes: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(
        resumeRow === undefined ? { data: null, error: {} } : { data: resumeRow, error: null }
      ),
    },
    exports: {
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 'exp1' }, error: null }) })),
      })),
      update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) })),
    },
  };
  return {
    auth: { getUser: jest.fn(async () => ({ data: { user: authUser } })) },
    storage: {
      from: jest.fn((_bucket: string) => ({
        upload: jest.fn(async (_name: string, _buf: Buffer, _opts: any) => ({ data: { path: 'u1/123/exp1.pdf' }, error: null })),
      })),
    },
    from: (name: string) => tables[name],
  };
}

describe('/api/resumes/[id]/export/pdf', () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
  const url = (id: string) => new Request(`http://localhost/api/resumes/${id}/export/pdf`);

  beforeEach(() => {
    jest.clearAllMocks();
    // Caminho de executável explícito para facilitar resolução
    process.env.PUPPETEER_EXECUTABLE_PATH = 'C:/bin/chrome.exe';
    const fs = jest.requireMock('node:fs') as { statSync: jest.Mock; existsSync: jest.Mock };
    fs.statSync.mockImplementation((p: string) => {
      // Normalizar caminho para comparação consistente
      const normalizedPath = p.replace(/\\/g, '/');
      return {
        isFile: () => normalizedPath.toLowerCase().endsWith('.exe') || normalizedPath === 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        isDirectory: () => !normalizedPath.toLowerCase().endsWith('.exe'),
      };
    });
    fs.existsSync.mockImplementation((p: string) => {
      // Garantir que o caminho do Chrome seja reconhecido (normalizar barras)
      const normalizedPath = p.replace(/\\/g, '/');
      return normalizedPath === 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    });
  });

  it('401 quando não autenticado', async () => {
    __supabaseMock = makeSupabase({ authUser: null });
    const { GET } = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await GET(url('123'), ctx('123') as any);
    expect(res.status).toBe(401);
  });

  it('404 quando currículo não existe', async () => {
    __supabaseMock = makeSupabase({ authUser: { id: 'u1' }, resumeRow: undefined });
    const { GET } = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await GET(url('123'), ctx('123') as any);
    expect(res.status).toBe(404);
  });

  it('403 quando pertence a outro usuário', async () => {
    __supabaseMock = makeSupabase({ authUser: { id: 'u1' }, resumeRow: { id: '123', user_id: 'u2', version: 1 } });
    const { GET } = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await GET(url('123'), ctx('123') as any);
    expect(res.status).toBe(403);
  });

  it('500 quando nenhum executável encontrado', async () => {
    // Força falha removendo env e fazendo fs.statSync retornar diretório (mock já cobre quando não termina com .exe)
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    const fs = jest.requireMock('node:fs') as { statSync: jest.Mock };
    fs.statSync.mockImplementation(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); });
    __supabaseMock = makeSupabase({ authUser: { id: 'u1' }, resumeRow: { id: '123', user_id: 'u1', version: 2 } });
    const { GET } = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await GET(url('123'), ctx('123') as any);
    expect(res.status).toBe(500);
    // Em caso de erro, apenas valida o status 500 para ser resiliente a mensagens de erro
  });

  it('200 e retorna PDF inline', async () => {
    __supabaseMock = makeSupabase({ authUser: { id: 'u1' }, resumeRow: { id: '123', user_id: 'u1', version: 3 } });
    const mod = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await mod.GET(url('123'), ctx('123') as any);
    expect(res.status).toBe(200);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    expect(ct).toContain('pdf');
    const cd = (res.headers.get('content-disposition') || '').toLowerCase();
    expect(cd).toContain('inline');
    // Não valida o corpo para evitar diferenças de stream; cabeçalhos e status bastam
  });

  it('POST delega para GET', async () => {
    __supabaseMock = makeSupabase({ authUser: { id: 'u1' }, resumeRow: { id: '123', user_id: 'u1', version: 3 } });
    const { POST } = await import('@/app/api/resumes/[id]/export/pdf/route');
    const res = await POST(url('123'), ctx('123') as any);
    expect(res.status).toBe(200);
  });
});
