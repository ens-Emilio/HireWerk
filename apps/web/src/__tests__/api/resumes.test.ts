export {};

let supabase: any;
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => supabase,
}));

describe('API /api/resumes', () => {
  beforeEach(() => {
    const list = [{ id: 'r1', title: 'CV', updated_at: '2024-01-01', deleted_at: null }];
    const resumesBuilder = {
      select: (_: string) => ({
        eq: (_f1: string, _v1: any) => ({
          is: (_f2: string, _v2: any) => ({
            order: (_f3: string, _opts: any) => ({ data: list, error: null }),
          }),
        }),
      }),
      insert: (_payload: any) => ({
        select: (_: string) => ({
          single: async () => ({ data: { id: 'new-id' }, error: null }),
        }),
      }),
    };
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table !== 'resumes') throw new Error('unexpected table: ' + table);
        return resumesBuilder;
      }),
    };
  });

  it('GET 401 quando não autenticado', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import('@/app/api/resumes/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET 200 com lista', async () => {
    const { GET } = await import('@/app/api/resumes/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0].id).toBe('r1');
  });

  it('POST 401 quando não autenticado', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import('@/app/api/resumes/route');
    const req = new Request('http://localhost/api/resumes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'X' }) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST 201 cria e retorna id', async () => {
    const { POST } = await import('@/app/api/resumes/route');
    const req = new Request('http://localhost/api/resumes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Meu CV' }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('new-id');
  });
});
