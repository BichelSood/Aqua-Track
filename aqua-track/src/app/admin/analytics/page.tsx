import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminDashboardData } from "@/features/admin/get-dashboard-data";
import { getAdminBatches, getAdminComplaints } from "@/features/admin/get-admin-lists";
import { getUserRoleGroupLabel, laundryStatusLabels } from "@/lib/labels";
import { LAUNDRY_STATUSES, USER_ROLES } from "@/types";

export default async function AdminAnalyticsPage() {
  await requireRole("ADMIN");
  const [{ laundryOrders, orderStatusCounts, roleCounts, pickupSessions }, batches, complaints] =
    await Promise.all([
      getAdminDashboardData(),
      getAdminBatches(),
      getAdminComplaints({}),
    ]);

  const openComplaints = complaints.filter(
    (item) => item.status === "OPEN" || item.status === "IN_REVIEW",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Operational counts from live data.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Orders" value={laundryOrders.length} />
        <StatCard title="Pickup sessions" value={pickupSessions.length} />
        <StatCard title="Washing batches" value={batches.washing.length} />
        <StatCard title="Open complaints" value={openComplaints} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {USER_ROLES.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm">{getUserRoleGroupLabel(role)}</span>
                <Badge>{roleCounts[role] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {LAUNDRY_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm">{laundryStatusLabels[status]}</span>
                <Badge>{orderStatusCounts[status] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
