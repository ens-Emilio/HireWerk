export {};
// Jest unit tests para rota de export JSON
 // Mock global do supabase server client
 // Usaremos import dinâmico do módulo da rota após definir o mock
 
 declare global {
   // eslint-disable-next-line no-var
   var __supabaseMock: any;
 }

jest.mock('@/lib/supabase/server', () => {
  return {
    getSupabaseServerClient: jest.fn(async () => (globalThis as any).__supabaseMock),
  };
});

function makeSupabase({
  authUser,
  resumeRow,
}: {
  authUser: { id: string } | null;
  resumeRow?: any;
}) {
  const tables: Record<string, any> = {
    resumes: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(
        resumeRow === undefined
          ? { data: null, error: { message: 'not found' } }
          : { data: resumeRow, error: null }
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
    from: (name: string) => tables[name],
  };
}

describe('/api/resumes/[id]/export/json', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('retorna 401 quando não autenticado', async () => {
    (globalThis as any).__supabaseMock = makeSupabase({ authUser: null });
    const { GET } = await import('@/app/api/resumes/[id]/export/json/route');
    const res = await GET(new Request('http://localhost/api/resumes/123/export/json'), {
      params: Promise.resolve({ id: '123' }),
    } as any);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando currículo é de outro usuário', async () => {
    (globalThis as any).__supabaseMock = makeSupabase({
      authUser: { id: 'u1' },
      resumeRow: { id: '123', user_id: 'u2', version: 1, title: null, data: {}, template_id: null, created_at: null, updated_at: null },
    });
    const { GET } = await import('@/app/api/resumes/[id]/export/json/route');
    const res = await GET(new Request('http://localhost/api/resumes/123/export/json'), {
      params: Promise.resolve({ id: '123' }),
    } as any);
    expect(res.status).toBe(403);
  });

  it('retorna 200 e JSON válido', async () => {
    (globalThis as any).__supabaseMock = makeSupabase({
      authUser: { id: 'u1' },
      resumeRow: { id: '123', user_id: 'u1', version: 2, title: 'Meu CV', data: { foo: 'bar' }, template_id: null, created_at: null, updated_at: null },
    });
    const { GET } = await import('@/app/api/resumes/[id]/export/json/route');
    const res = await GET(new Request('http://localhost/api/resumes/123/export/json'), {
      params: Promise.resolve({ id: '123' }),
    } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    const text = await res.text();
    const json = JSON.parse(text);
    expect(json).toMatchObject({ id: '123', data: { foo: 'bar' }, version: 2 });
  });
});
