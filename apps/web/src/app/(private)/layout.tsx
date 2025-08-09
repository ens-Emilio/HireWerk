import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Sidebar from "../_components/Sidebar";
import CurrentContext from "../_components/CurrentContext";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr] bg-background text-foreground">
      {/* Sidebar */}
      <div>
        <Sidebar />
        <div className="px-4">
          <CurrentContext variant="sidebar" />
        </div>
      </div>
      {/* Main */}
      <main className="p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}


