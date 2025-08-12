export {};

let supabase: any;
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => supabase,
}));

describe('GET /api/templates', () => {
  beforeEach(() => {
    supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table !== 'templates') throw new Error('unexpected table: ' + table);
        return {
          select: (_: string) => ({
            order: (_field: string, _opts: any) => ({ data: [{ id: 't1', slug: 'basic', name: 'Basic', preview_image_url: '' }], error: null }),
          }),
        };
      }),
    };
  });

  it('401 quando não autenticado', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import('@/app/api/templates/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('200 e lista de templates', async () => {
    const { GET } = await import('@/app/api/templates/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0].id).toBe('t1');
  });
});
