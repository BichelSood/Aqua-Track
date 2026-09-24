import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPickupSessionStatusLabel } from "@/lib/labels";
import type { ReactNode } from "react";

export function PickupSessionCard({
  id,
  hostelName,
  hostelCode,
  scheduledDate,
  startTime,
  endTime,
  status,
  href,
  children,
}: {
  id: string;
  hostelName: string;
  hostelCode?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  href?: string;
  children?: ReactNode;
}) {
  const title = href ? (
    <Link href={href} className="hover:underline">
      {hostelName}
    </Link>
  ) : (
    hostelName
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{hostelCode ?? id}</CardDescription>
          </div>
          <Badge>{getPickupSessionStatusLabel(status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {scheduledDate} · {startTime}–{endTime}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
