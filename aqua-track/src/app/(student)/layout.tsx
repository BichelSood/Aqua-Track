import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { StudentNav, StudentSideNav } from "@/components/student-nav";
import { requireRole } from "@/lib/auth/require-role";
import { getUnreadNotificationCount } from "@/features/student/get-dashboard-data";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("STUDENT");
  const unreadCount = await getUnreadNotificationCount(profile.id);

  const studentTables = [
    { table: "notifications", filter: `user_id=eq.${profile.id}` },
    { table: "laundry_orders", filter: `student_id=eq.${profile.id}` },
    { table: "messages" },
    ...(profile.hostel_id
      ? [
          {
            table: "pickup_sessions",
            filter: `hostel_id=eq.${profile.hostel_id}`,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        channelName={`student-${profile.id}`}
        tables={studentTables}
      />
      <AppShell
        name={profile.full_name}
        roleLabel="Student"
        sidebar={<StudentSideNav unreadCount={unreadCount} />}
        bottomNav={<StudentNav unreadCount={unreadCount} />}
      >
        {children}
      </AppShell>
    </div>
  );
}
