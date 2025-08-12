export default function Head() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let preconnectHref: string | null = null;
  try {
    preconnectHref = supabaseUrl ? new URL(supabaseUrl).origin : null;
  } catch {
    preconnectHref = null;
  }
  return (
    <>
      {preconnectHref ? (
        <link rel="preconnect" href={preconnectHref} crossOrigin="anonymous" />
      ) : null}
    </>
  );
}
