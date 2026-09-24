import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getWashingBatches } from "@/features/washing/get-washing-data";
import { getWashingBatchStatusLabel } from "@/lib/labels";
import { ReceiveBatchButton } from "../receive-batch-button";

export default async function WashingBatchesPage() {
  const profile = await requireRole("WASHING_STAFF");
  const batches = await getWashingBatches(profile.facility_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Batches</h2>
        <p className="text-sm text-muted-foreground">
          Receive the whole shipment before processing individual bags.
        </p>
      </div>

      {batches.length === 0 ? (
        <EmptyState message="No washing batches are waiting." />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
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
                {batch.status === "CREATED" ? (
                  <ReceiveBatchButton washingBatchId={batch.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Process bags from the queue or scanner.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
