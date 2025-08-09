"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env não configurado (URL/ANON_KEY)");
  }
  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        return document.cookie
          .split("; ")
          .filter(Boolean)
          .map((c) => {
            const [name, ...rest] = c.split("=");
            return { name, value: rest.join("=") };
          });
      },
      setAll(cookies) {
        if (typeof document === "undefined") return;
        cookies.forEach(({ name, value, options }) => {
          const parts = [
            `${name}=${value}`,
            options?.path ? `Path=${options.path}` : "Path=/",
            options?.maxAge ? `Max-Age=${options.maxAge}` : undefined,
            options?.domain ? `Domain=${options.domain}` : undefined,
            options?.sameSite ? `SameSite=${options.sameSite}` : undefined,
            options?.secure ? `Secure` : undefined,
          ].filter(Boolean);
          document.cookie = parts.join("; ");
        });
      },
    },
  });
  return client;
}


