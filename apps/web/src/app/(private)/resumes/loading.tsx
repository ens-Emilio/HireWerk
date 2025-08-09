export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-72 rounded bg-secondary/20 animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 rounded bg-secondary/20 animate-pulse" />
        <div className="h-9 w-36 rounded bg-secondary/20 animate-pulse" />
      </div>
      <div className="rounded-md border border-secondary/40">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 border-b last:border-b-0 border-secondary/40 bg-secondary/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
