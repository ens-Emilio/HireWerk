export {};

let supabase: any;
let mockVerifier: any;

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => supabase,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockVerifier,
}));

describe('POST /api/account/password', () => {
  beforeEach(() => {
    jest.resetModules();
    supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'u1@example.com' } } }),
        updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    };
    mockVerifier = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    };
  });

  const req = (body: any) => new Request('http://localhost/api/account/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  it('401 quando não autenticado', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'a', newPassword: '12345678' }));
    expect(res.status).toBe(401);
  });

  it('400 quando campos ausentes', async () => {
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: '', newPassword: '' }));
    expect(res.status).toBe(400);
  });

  it('400 quando nova senha muito curta', async () => {
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'abc', newPassword: '123' }));
    expect(res.status).toBe(400);
  });

  it('500 quando env do Supabase ausente', async () => {
    const urlBak = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const keyBak = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'oldpass', newPassword: '12345678' }));
    expect(res.status).toBe(500);
    process.env.NEXT_PUBLIC_SUPABASE_URL = urlBak;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = keyBak;
  });

  it('400 quando senha atual incorreta', async () => {
    mockVerifier.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'invalid', status: 400 } });
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'wrong', newPassword: '12345678' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/Senha atual incorreta|não foi possível verificar/i);
  });

  it('400 quando updateUser falha', async () => {
    mockVerifier.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    supabase.auth.updateUser.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'oldpass', newPassword: '12345678' }));
    expect(res.status).toBe(400);
  });

  it('200 quando sucesso', async () => {
    const { POST } = await import('@/app/api/account/password/route');
    const res = await POST(req({ currentPassword: 'oldpass', newPassword: '12345678' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
