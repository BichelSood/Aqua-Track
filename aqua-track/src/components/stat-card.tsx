import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  const numeric = typeof value === "number";

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-accent/10 blur-2xl" />
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <span className="rounded-xl bg-accent/12 p-2 text-highlight">
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">
          <AnimatedNumber value={value} />
        </p>
        {description ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
        {numeric ? (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${Math.min(100, Number(value) * 8 + 12)}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
