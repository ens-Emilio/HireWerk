export {};

let supabase: any;
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => supabase,
}));

describe('API /api/resumes/[id]', () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  it('GET 401 sem auth', async () => {
    supabase = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) } } as any;
    const { GET } = await import('@/app/api/resumes/[id]/route');
    const res = await GET(new Request('http://localhost'), ctx('r1'));
    expect(res.status).toBe(401);
  });

  it('GET 404 quando não encontrado', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => ({
        select: (_: string) => ({ eq: (_f: string, _v: any) => ({ single: async () => ({ data: null, error: {} }) }) }),
      })),
    };
    const { GET } = await import('@/app/api/resumes/[id]/route');
    const res = await GET(new Request('http://localhost'), ctx('missing'));
    expect(res.status).toBe(404);
  });

  it('GET 403 quando pertence a outro usuário', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'r1', user_id: 'u2', title: 'X' }, error: null }) }) }),
      })),
    };
    const { GET } = await import('@/app/api/resumes/[id]/route');
    const res = await GET(new Request('http://localhost'), ctx('r1'));
    expect(res.status).toBe(403);
  });

  it('GET 200 com item (sem user_id)', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'r1', user_id: 'u1', title: 'X' }, error: null }) }) }),
      })),
    };
    const { GET } = await import('@/app/api/resumes/[id]/route');
    const res = await GET(new Request('http://localhost'), ctx('r1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.id).toBe('r1');
    expect(body.item.user_id).toBeUndefined();
  });

  it('PUT 401 sem auth', async () => {
    supabase = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) } } as any;
    const { PUT } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Y' }) });
    const res = await PUT(req, ctx('r1'));
    expect(res.status).toBe(401);
  });

  it('PUT 404 quando não existe', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => ({
        select: (cols: string) => ({ eq: (_f: string, _v: any) => ({ single: async () => (cols === 'user_id' ? { data: null, error: {} } : { data: {}, error: null }) }) }),
        update: (_u: any) => ({ eq: async (_f: string, _id: string) => ({ error: null }) }),
      })),
    };
    const { PUT } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Y' }) });
    const res = await PUT(req, ctx('x'));
    expect(res.status).toBe(404);
  });

  it('PUT 403 quando pertence a outro usuário', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => ({
        select: (cols: string) => ({ eq: () => ({ single: async () => (cols === 'user_id' ? { data: { user_id: 'u2' }, error: null } : { data: {}, error: null }) }) }),
        update: (_u: any) => ({ eq: async () => ({ error: null }) }),
      })),
    };
    const { PUT } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Y' }) });
    const res = await PUT(req, ctx('r1'));
    expect(res.status).toBe(403);
  });

  it('PUT 200 atualiza com sucesso', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => ({
        select: (cols: string) => ({ eq: () => ({ single: async () => (cols === 'user_id' ? { data: { user_id: 'u1' }, error: null } : { data: {}, error: null }) }) }),
        update: (_u: any) => ({ eq: async () => ({ error: null }) }),
      })),
    };
    const { PUT } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Y' }) });
    const res = await PUT(req, ctx('r1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('PATCH 401 sem auth', async () => {
    supabase = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) } } as any;
    const { PATCH } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Z' }) });
    const res = await PATCH(req, ctx('r1'));
    expect(res.status).toBe(401);
  });

  it('PATCH 200 atualiza com sucesso', async () => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => ({ update: (_u: any) => ({ eq: async () => ({ error: null }) }) })),
    };
    const { PATCH } = await import('@/app/api/resumes/[id]/route');
    const req = new Request('http://localhost', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Z' }) });
    const res = await PATCH(req, ctx('r1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
