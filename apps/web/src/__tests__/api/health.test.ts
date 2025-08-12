export {};

describe('GET /api/health', () => {
  it('retorna ok: true', async () => {
    const mod = await import('@/app/api/health/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
