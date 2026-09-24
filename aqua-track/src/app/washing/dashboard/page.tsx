import Link from "next/link";
import { Droplets, Layers, Sparkles } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageIntro } from "@/components/page-intro";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getWashingDashboardData } from "@/features/washing/get-washing-data";
import { getWashingBatchStatusLabel } from "@/lib/labels";

export default async function WashingDashboardPage() {
  const profile = await requireRole("WASHING_STAFF");
  const { incomingCount, processingCount, readyCount, recentBatches } =
    await getWashingDashboardData(profile.facility_id);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Dashboard"
        description="Incoming batches, washing in progress, and bags ready to leave."
        action={
          <Button asChild>
            <Link href="/washing/scan">Open scanner</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Incoming batches"
          value={incomingCount}
          description="Waiting to be received"
          icon={Layers}
        />
        <StatCard
          title="Under washing"
          value={processingCount}
          icon={Droplets}
        />
        <StatCard
          title="Ready for delivery"
          value={readyCount}
          icon={Sparkles}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Recent batches</h3>
        {recentBatches.length === 0 ? (
          <EmptyState message="No open washing batches." />
        ) : (
          recentBatches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{batch.batch_number}</CardTitle>
                    <CardDescription>
                      Created {new Date(batch.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge>{getWashingBatchStatusLabel(batch.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/washing/batches" className="text-sm underline">
                  View batches
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
