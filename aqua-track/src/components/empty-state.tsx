import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  message: string;
  className?: string;
};

export function EmptyState({ title, message, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-[1.125rem] border border-dashed border-highlight/15 py-10 text-center", className)}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
