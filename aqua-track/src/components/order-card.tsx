import type { ReactNode } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { LAUNDRY_STATUSES, type LaundryStatus } from "@/types";

type OrderCardProps = {
  orderNumber: string;
  status: string;
  bagCode?: string | null;
  studentName?: string | null;
  createdAt?: string;
  href?: string;
  children?: ReactNode;
};

function StatusTrack({ status }: { status: string }) {
  const index = LAUNDRY_STATUSES.indexOf(status as LaundryStatus);
  if (index < 0) {
    return null;
  }

  return (
    <div className="mt-4 flex gap-1" aria-hidden="true">
      {LAUNDRY_STATUSES.map((step, stepIndex) => (
        <span
          key={step}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            stepIndex <= index ? "bg-accent" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export function OrderCard({
  orderNumber,
  status,
  bagCode,
  studentName,
  createdAt,
  href,
  children,
}: OrderCardProps) {
  const title = href ? (
    <Link href={href} className="font-semibold underline-offset-4 hover:underline">
      {orderNumber}
    </Link>
  ) : (
    <p className="font-semibold">{orderNumber}</p>
  );
  return (
    <div className="glass-panel rounded-[1.125rem] p-4 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          {title}

          {studentName ? (
            <p className="text-sm text-muted-foreground">{studentName}</p>
          ) : null}

          {bagCode ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Bag: {bagCode}
            </p>
          ) : null}
        </div>

        <StatusBadge status={status} />
      </div>

      {createdAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Created {new Date(createdAt).toLocaleString()}
        </p>
      ) : null}

      <StatusTrack status={status} />

      {children}
    </div>
  );
}
