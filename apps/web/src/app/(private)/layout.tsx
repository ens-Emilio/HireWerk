import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import ResponsiveShell from "../_components/ResponsiveShell";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="theme-dark">
      <ResponsiveShell>
        {children}
      </ResponsiveShell>
    </div>
  );
}


