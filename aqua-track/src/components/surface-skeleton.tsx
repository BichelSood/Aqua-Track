export function SurfaceSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-white/8" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[1.125rem] bg-white/6"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-[1.125rem] bg-white/5"
        />
      ))}
    </div>
  );
}
