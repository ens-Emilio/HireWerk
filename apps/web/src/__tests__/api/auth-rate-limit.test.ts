export {};

let getSupabaseAdminClient: any;

jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => getSupabaseAdminClient(),
}));

describe('POST /api/auth/rate-limit', () => {
  const req = (body: any, headers?: Record<string, string>) => new Request('http://localhost/api/auth/rate-limit', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(headers || {}) },
    body: JSON.stringify(body),
  });

  beforeEach(() => {
    jest.resetModules();
    getSupabaseAdminClient = () => ({
      rpc: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { exceeded: false, current_count: 1 }, error: null }) })
    });
  });

  it('400 quando email ausente', async () => {
    const { POST } = await import('@/app/api/auth/rate-limit/route');
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it('200 em dev mode, sem bloquear', async () => {
    const { POST } = await import('@/app/api/auth/rate-limit/route');
    const res = await POST(req({ email: 'user@example.com', scope: 'login' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.exceeded).toBe(false);
  });

  it('usa IP dos headers x-forwarded-for ou x-real-ip', async () => {
    const { POST } = await import('@/app/api/auth/rate-limit/route');
    const res = await POST(req({ email: 'user@example.com' }, { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }));
    expect(res.status).toBe(200);
  });
});
