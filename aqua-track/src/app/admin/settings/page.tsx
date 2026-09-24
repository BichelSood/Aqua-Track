import { CreatePickupForm } from "../create-pickup-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminDashboardData } from "@/features/admin/get-dashboard-data";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const { profiles, hostels } = await getAdminDashboardData();

  const activeHostels = hostels.filter((hostel) => hostel.is_active);
  const deliveryBoys = profiles.filter(
    (user) => user.role === "DELIVERY_BOY" && user.is_active,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Pickup scheduling. User and bag changes are on their own pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create pickup session</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePickupForm
            hostels={activeHostels.map((hostel) => ({
              id: hostel.id,
              name: hostel.name,
              code: hostel.code,
            }))}
            deliveryBoys={deliveryBoys.map((deliveryBoy) => ({
              id: deliveryBoy.id,
              full_name: deliveryBoy.full_name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
