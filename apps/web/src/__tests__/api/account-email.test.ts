export {};

let supabase: any;
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => supabase,
}));

describe('POST /api/account/email', () => {
  beforeEach(() => {
    supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'old@example.com' } } }),
        updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    };
  });

  const req = (body: any) => new Request('http://localhost/api/account/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  it('401 quando não autenticado', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import('@/app/api/account/email/route');
    const res = await POST(req({ email: 'new@example.com' }));
    expect(res.status).toBe(401);
  });

  it('400 quando e-mail ausente', async () => {
    const { POST } = await import('@/app/api/account/email/route');
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/E-mail/i);
  });

  it('400 quando updateUser retorna erro', async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: null, error: { message: 'bad' } });
    const { POST } = await import('@/app/api/account/email/route');
    const res = await POST(req({ email: 'new@example.com' }));
    expect(res.status).toBe(400);
  });

  it('200 ok quando updateUser ok', async () => {
    const { POST } = await import('@/app/api/account/email/route');
    const res = await POST(req({ email: 'new@example.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
