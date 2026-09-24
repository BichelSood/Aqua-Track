import { Separator } from "@/components/ui/separator";
import { getLaundryStatusLabel } from "@/lib/labels";

export type TimelineEntry = {
  id: string;
  toStatus: string;
  fromStatus?: string | null;
  createdAt: string;
  reason?: string | null;
};

type LaundryTimelineProps = {
  entries: TimelineEntry[];
};

export function LaundryTimeline({ entries }: LaundryTimelineProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div>
      <Separator className="my-4" />

      <h3 className="mb-4 text-sm font-semibold">Order Timeline</h3>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-xs font-semibold text-highlight">
                {index + 1}
              </div>

              {index < entries.length - 1 ? (
                <div className="mt-1 h-full min-h-5 w-px bg-border" />
              ) : null}
            </div>

            <div className="pb-2">
              <p className="font-medium">
                {getLaundryStatusLabel(entry.toStatus)}
              </p>

              <p className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </p>

              {entry.reason ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.reason}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
