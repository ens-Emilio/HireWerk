export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-7 w-64 rounded bg-foreground/10 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-md border border-border bg-foreground/10 animate-pulse" />
        <div className="h-28 rounded-md border border-border bg-foreground/10 animate-pulse" />
        <div className="h-28 rounded-md border border-border bg-foreground/10 animate-pulse" />
      </div>
    </div>
  );
}
