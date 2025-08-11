export default async function DashboardPage() {
  return (
    <div className="section grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Meu dashboard</h1>
        <p className="text-foreground/80 text-sm">Acesse rapidamente suas áreas de trabalho.</p>
      </div>
      <div className="card-grid">
        <a href="/resumes" className="surface-section rounded-lg border border-border p-5 hover:bg-foreground/10">
          <div className="text-sm font-semibold text-foreground/70">Currículos</div>
          <div className="mt-1 text-foreground">Gerenciar e editar</div>
        </a>
        <a href="/settings" className="surface-section rounded-lg border border-border p-5 hover:bg-foreground/10">
          <div className="text-sm font-semibold text-foreground/70">Configurações</div>
          <div className="mt-1 text-foreground">Conta e preferências</div>
        </a>
      </div>
    </div>
  );
}


