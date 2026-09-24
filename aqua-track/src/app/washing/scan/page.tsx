import { requireRole } from "@/lib/auth/require-role";
import { WashingScanner } from "./washing-scanner";

export default async function WashingScanPage() {
  await requireRole("WASHING_STAFF");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Scan</h2>
        <p className="text-sm text-muted-foreground">
          Keep the camera ready. The server chooses start washing or mark
          washed.
        </p>
      </div>
      <WashingScanner />
    </div>
  );
}
