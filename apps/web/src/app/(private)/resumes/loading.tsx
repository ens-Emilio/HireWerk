export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-72 rounded bg-foreground/10 animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 rounded bg-foreground/10 animate-pulse" />
        <div className="h-9 w-36 rounded bg-foreground/10 animate-pulse" />
      </div>
      <div className="rounded-md border border-border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 border-b last:border-b-0 border-border bg-foreground/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
