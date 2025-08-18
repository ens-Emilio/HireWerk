import ResponsiveShell from "../_components/ResponsiveShell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redireciona ao login; "next" opcional para pós-login (fallback no login é /dashboard)
    redirect("/login");
  }

  return <ResponsiveShell>{children}</ResponsiveShell>;
}


