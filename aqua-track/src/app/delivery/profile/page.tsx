import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getUserRoleLabel } from "@/lib/labels";

export default async function DeliveryProfilePage() {
  const profile = await requireRole("DELIVERY_BOY");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Delivery staff account details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Role: {getUserRoleLabel(profile.role)}</p>
          <p>Phone: {profile.phone ?? "Not set"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
