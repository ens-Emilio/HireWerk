import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import A4Preview from "@/app/_components/A4Preview";

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isLogged = Boolean(data.user);
  const ctaHref = isLogged ? "/dashboard" : "/login";
  return (
    <main className="bg-background">
      <section className="section pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 items-start">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
              Crie currículos profissionais em minutos
            </h1>
            <p className="mt-4 text-lg text-foreground/80">
              Escolha um template bonito, edite campos estruturados e baixe em PDF. Simples, rápido e gratuito no MVP.
            </p>
            <div className="mt-6 flex gap-3">
              <a href={ctaHref}>
                <Button size="lg" variant="primary">Começar agora</Button>
              </a>
              <a href="#como-funciona">
                <Button size="lg" variant="outline">Ver como funciona</Button>
              </a>
            </div>
            <div id="recursos" className="mt-10 grid grid-cols-2 gap-4 text-sm">
              <Card padding="lg">
                <div className="font-medium text-primary">Templates</div>
                <div className="text-primary/80">3 estilos no MVP</div>
              </Card>
              <Card padding="lg">
                <div className="font-medium text-primary">PDF fiel</div>
                <div className="text-primary/80">Pronto para impressão</div>
              </Card>
              <Card padding="lg">
                <div className="font-medium text-primary">Autosave</div>
                <div className="text-primary/80">Sem perder progresso</div>
              </Card>
              <Card padding="lg">
                <div className="font-medium text-primary">Exportar JSON</div>
                <div className="text-primary/80">Versione seus dados</div>
              </Card>
            </div>
          </div>
          <div className="lg:justify-self-end lg:-mt-2">
            <A4Preview />
          </div>
        </div>
        </div>
      </section>

      <section id="como-funciona" className="surface-section border-t border-secondary/40">
        <div className="mx-auto max-w-6xl px-4 section card-grid">
          <div>
            <div className="text-sm font-semibold text-foreground/70">1. Crie</div>
            <div className="mt-1 text-foreground">Faça login e comece um currículo</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground/70">2. Edite</div>
            <div className="mt-1 text-foreground">Preencha campos e personalize</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground/70">3. Exporte</div>
            <div className="mt-1 text-foreground">Baixe em PDF com um clique</div>
          </div>
        </div>
      </section>
    </main>
  );
}
