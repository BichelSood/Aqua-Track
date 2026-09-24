"use client";

export function Greeting({ name }: { name: string }) {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mt-1">
      <h1
        className="text-2xl font-semibold tracking-tight md:text-3xl"
        suppressHydrationWarning
      >
        {hello}, {name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live laundry operations, from bag scan to doorstep.
      </p>
    </div>
  );
}
