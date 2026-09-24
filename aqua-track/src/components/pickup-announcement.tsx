import { Badge } from "@/components/ui/badge";
import { getPickupSessionStatusLabel } from "@/lib/labels";

type PickupAnnouncementProps = {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

export function PickupAnnouncement({
  scheduledDate,
  startTime,
  endTime,
  status,
}: PickupAnnouncementProps) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{scheduledDate}</p>
      <p className="text-sm text-muted-foreground">
        {startTime}–{endTime}
      </p>
      <Badge>{getPickupSessionStatusLabel(status)}</Badge>
    </div>
  );
}
