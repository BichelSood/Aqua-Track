import { requireRole } from "@/lib/auth/require-role";
import { UniversalScanner } from "./universal-scanner";

export default async function DeliveryScanPage() {
  await requireRole("DELIVERY_BOY");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Scan</h2>
        <p className="text-sm text-muted-foreground">
          Keep the camera ready. Collection and delivery use the same scanner.
          The server chooses the valid action.
        </p>
      </div>
      <UniversalScanner />
    </div>
  );
}
