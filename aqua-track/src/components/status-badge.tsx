import { getLaundryStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { LAUNDRY_STATUSES, type LaundryStatus } from "@/types";

const STATUS_TONE: Record<LaundryStatus, string> = {
  COLLECTED: "border-highlight/30 bg-highlight/10 text-highlight",
  RECEIVED_AT_FACILITY: "border-primary/40 bg-primary/15 text-[#9fd6ee]",
  UNDER_WASHING: "border-accent/40 bg-accent/12 text-accent",
  READY_FOR_DELIVERY: "border-success/35 bg-success/12 text-success",
  OUT_FOR_DELIVERY: "border-warning/40 bg-warning/12 text-warning",
  DELIVERY_ATTEMPTED: "border-destructive/40 bg-destructive/12 text-destructive",
  DELIVERED: "border-success/25 bg-success/8 text-success",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone =
    STATUS_TONE[status as LaundryStatus] ??
    "border-border bg-muted/40 text-muted-foreground";
  const live =
    status !== "DELIVERED" &&
    LAUNDRY_STATUSES.includes(status as LaundryStatus);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase",
        tone,
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {live ? (
          <span className="status-pulse absolute inline-flex size-full rounded-full bg-current" />
        ) : null}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {getLaundryStatusLabel(status)}
    </span>
  );
}
