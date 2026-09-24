import Link from "next/link";
import { Building2, CalendarDays, Shirt, Users } from "lucide-react";
import { AnnouncePickupButton } from "../announce-pickup-button";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
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
import {
  getPickupSessionStatusLabel,
  getUserRoleGroupLabel,
  laundryStatusLabels,
} from "@/lib/labels";
import { LAUNDRY_STATUSES, USER_ROLES } from "@/types";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const {
    profiles,
    hostels,
    pickupSessions,
    laundryOrders,
    orderStatusCounts,
    roleCounts,
  } = await getAdminDashboardData();

  const activeUsers = profiles.filter((user) => user.is_active).length;
  const activePickupSessions = pickupSessions.filter(
    (session) =>
      session.status === "ANNOUNCED" || session.status === "ACTIVE",
  ).length;
  const activeHostels = hostels.filter((hostel) => hostel.is_active);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Dashboard"
        description="Operational overview. Pickup setup is in Settings."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active users" value={activeUsers} icon={Users} />
        <StatCard title="Hostels" value={activeHostels.length} icon={Building2} />
        <StatCard
          title="Pickup sessions"
          value={activePickupSessions}
          description="Announced or active"
          icon={CalendarDays}
        />
        <StatCard title="Laundry orders" value={laundryOrders.length} icon={Shirt} />
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
                className="flex items-center justify-between rounded-xl border border-border/80 bg-white/3 p-3"
              >
                <span className="text-sm font-medium">
                  {getUserRoleGroupLabel(role)}
                </span>
                <Badge>{roleCounts[role] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laundry by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {LAUNDRY_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-white/3 p-3"
              >
                <span className="text-sm font-medium">
                  {laundryStatusLabels[status]}
                </span>
                <Badge>{orderStatusCounts[status] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pickup sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {pickupSessions.length === 0 ? (
            <EmptyState message="No pickup sessions found." />
          ) : (
            <div className="space-y-3">
              {pickupSessions.slice(0, 8).map((session) => (
                <div key={session.id} className="rounded-xl border border-border/80 bg-white/3 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {session.hostel?.name ?? "Unknown hostel"}
                      </p>
                      <p className="text-sm">
                        {session.scheduled_date} · {session.start_time}–
                        {session.end_time}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Badge>
                        {getPickupSessionStatusLabel(session.status)}
                      </Badge>
                      {session.status === "SCHEDULED" ? (
                        <AnnouncePickupButton pickupSessionId={session.id} />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm">
            <Link href="/admin/settings" className="underline">
              Create a pickup session
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
