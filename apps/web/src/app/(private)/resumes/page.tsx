import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createResume, softDeleteResume } from "./actions";
import { Button } from "@/components/ui/Button";
import ToastEvents from "./ToastEvents";
import { Card } from "@/components/ui/Card";

export default async function ResumesPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("resumes")
    .select("id,title,updated_at,deleted_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <ToastEvents />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Meus currículos</h1>
        <form action={createResume}>
          <Button variant="secondary" size="md" type="submit">
            Novo currículo
          </Button>
        </form>
      </div>

      {data && data.length > 0 ? (
        <ul className="divide-y divide-secondary/50 rounded-md border border-secondary/50 bg-surface text-foreground">
          {data.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link href={`/resumes/${r.id}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
                <div className="text-xs text-foreground/80">
                  Atualizado em {new Date(r.updated_at as string).toLocaleString()}
                </div>
              </div>
              <form action={async (formData) => {
                "use server";
                const id = formData.get("id") as string;
                await softDeleteResume(id);
              }}>
                <input type="hidden" name="id" value={r.id} />
                <Button variant="danger" size="sm" type="submit">
                  Excluir
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground/80">Nenhum currículo ainda</div>
            <div className="mt-1 text-foreground">Crie seu primeiro currículo para começar.</div>
          </div>
          <form action={createResume}>
            <Button variant="secondary" size="md" type="submit">
              Criar currículo
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}


