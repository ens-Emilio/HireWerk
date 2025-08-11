import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { restoreResume, emptyTrash } from "../actions";
import { Button } from "@/components/ui/Button";
import ToastEvents from "../ToastEvents";
import { Card } from "@/components/ui/Card";

export default async function TrashResumesPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("resumes")
    .select("id,title,updated_at,deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div className="space-y-6">
      <ToastEvents />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Lixeira</h1>
        <div className="flex items-center gap-3">
          {data && data.length > 0 ? (
            <form action={emptyTrash}>
              <Button variant="danger" size="sm" type="submit">
                Esvaziar lixeira
              </Button>
            </form>
          ) : null}
          <Link href="/resumes" className="text-sm text-foreground hover:underline">
            Voltar para currículos
          </Link>
        </div>
      </div>

      {data && data.length > 0 ? (
        <ul className="divide-y divide-border rounded-md border border-border bg-white text-black">
          {data.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-black/70">
                  Removido em {new Date(r.deleted_at as string).toLocaleString()}
                </div>
              </div>
              <form
                action={async (formData) => {
                  "use server";
                  const id = formData.get("id") as string;
                  await restoreResume(id);
                }}
              >
                <input type="hidden" name="id" value={r.id} />
                <Button variant="primary" size="sm" type="submit">
                  Restaurar
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-black">Lixeira vazia</div>
            <div className="mt-1 text-black/80">Nenhum currículo na lixeira.</div>
          </div>
          <Link href="/resumes" className="text-sm text-blue-600 hover:underline">
            Voltar para currículos
          </Link>
        </Card>
      )}
    </div>
  );
}
