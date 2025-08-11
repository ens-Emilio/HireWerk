import { getSupabaseServerClient } from "@/lib/supabase/server";
import UpdateEmailForm from "./UpdateEmailForm";
import UpdatePasswordForm from "./UpdatePasswordForm";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações da conta</h1>
        <p className="text-sm text-foreground/70">Gerencie seu e-mail e senha com segurança.</p>
      </div>

      <section className="rounded-lg border border-border bg-foreground/10 p-4 md:p-6 text-foreground">
        <h2 className="text-lg font-semibold text-foreground">E-mail</h2>
        <p className="mt-1 text-sm text-foreground/70">Seu e-mail atual: {email}</p>
        <div className="mt-4">
          <UpdateEmailForm currentEmail={email} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-foreground/10 p-4 md:p-6 text-foreground">
        <h2 className="text-lg font-semibold text-foreground">Senha</h2>
        <p className="mt-1 text-sm text-foreground/70">Defina uma nova senha para sua conta.</p>
        <div className="mt-4">
          <UpdatePasswordForm />
        </div>
      </section>
    </div>
  );
}


