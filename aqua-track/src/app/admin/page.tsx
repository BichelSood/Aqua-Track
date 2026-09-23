import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminDashboardData } from "@/lib/dashboard/admin";
import { CreatePickupForm } from "./create-pickup-form";

const statusLabels: Record<string, string> = {
  COLLECTED: "Collected",
  RECEIVED_AT_FACILITY: "Received at Facility",
  UNDER_WASHING: "Under Washing",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERY_ATTEMPTED: "Delivery Attempted",
  DELIVERED: "Delivered",
};

const roleLabels: Record<string, string> = {
  STUDENT: "Students",
  DELIVERY_BOY: "Delivery Staff",
  WASHING_STAFF: "Washing Staff",
  ADMIN: "Admins",
};

export default async function AdminPage() {
  const profile = await requireRole("ADMIN");

  const {
    profiles,
    hostels,
    pickupSessions,
    laundryOrders,
    orderStatusCounts,
    roleCounts,
  } = await getAdminDashboardData();

  const activeUsers = profiles.filter(
    (user) => user.is_active,
  ).length;

  const activePickupSessions = pickupSessions.filter(
    (session) =>
      session.status === "ANNOUNCED" ||
      session.status === "ACTIVE",
  ).length;

  const activeHostels = hostels.filter(
    (hostel) => hostel.is_active,
  );

  const deliveryBoys = profiles.filter(
    (user) =>
      user.role === "DELIVERY_BOY" &&
      user.is_active,
  );

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Header */}
        <header>
          <p className="text-sm text-muted-foreground">
            Aqua Track
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {profile.full_name}
          </p>
        </header>

        <Separator />

        {/* System Overview */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              System Overview
            </h2>

            <p className="text-sm text-muted-foreground">
              Current Aqua Track operational data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">
                  {activeUsers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Hostels
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">
                  {activeHostels.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Pickup Sessions
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">
                  {activePickupSessions}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Active or announced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Laundry Orders
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">
                  {laundryOrders.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Users + Laundry */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {Object.entries(roleLabels).map(
                  ([role, label]) => (
                    <div
                      key={role}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium">
                        {label}
                      </span>

                      <Badge>
                        {roleCounts[role] ?? 0}
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Laundry by Status</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusLabels).map(
                  ([status, label]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium">
                        {label}
                      </span>

                      <Badge>
                        {orderStatusCounts[status] ?? 0}
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Create Pickup Session */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>
                Create Pickup Session
              </CardTitle>
            </CardHeader>

            <CardContent>
              <CreatePickupForm
                hostels={activeHostels.map((hostel) => ({
                  id: hostel.id,
                  name: hostel.name,
                  code: hostel.code,
                }))}
                deliveryBoys={deliveryBoys.map(
                  (deliveryBoy) => ({
                    id: deliveryBoy.id,
                    full_name: deliveryBoy.full_name,
                  }),
                )}
              />
            </CardContent>
          </Card>
        </section>

        {/* Pickup Sessions */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Pickup Sessions</CardTitle>
            </CardHeader>

            <CardContent>
              {pickupSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pickup sessions found.
                </p>
              ) : (
                <div className="space-y-3">
                  {pickupSessions
                    .slice(0, 10)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">
                              {session.hostel?.name ??
                                "Unknown Hostel"}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {session.hostel?.code ??
                                "No hostel code"}
                            </p>

                            <p className="mt-2 text-sm">
                              {session.scheduled_date} ·{" "}
                              {session.start_time}–
                              {session.end_time}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Delivery:{" "}
                              {session.deliveryBoy
                                ?.full_name ??
                                "Not assigned"}
                            </p>
                          </div>

                          <Badge>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Laundry Orders */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>
                Recent Laundry Orders
              </CardTitle>
            </CardHeader>

            <CardContent>
              {laundryOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No laundry orders found.
                </p>
              ) : (
                <div className="space-y-3">
                  {laundryOrders
                    .slice(0, 10)
                    .map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            {order.order_number}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Created{" "}
                            {new Date(
                              order.created_at,
                            ).toLocaleString()}
                          </p>
                        </div>

                        <Badge>
                          {statusLabels[
                            order.status
                          ] ?? order.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}