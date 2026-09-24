import { EmptyState } from "@/components/empty-state";
import { NotificationCard } from "@/components/notification-card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentNotifications } from "@/features/student/get-dashboard-data";
import { NotificationActions } from "./notification-actions";

export default async function NotificationsPage() {
  const profile = await requireRole("STUDENT");
  const notifications = await getStudentNotifications(profile.id);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Status updates and pickup announcements.
          </p>
        </div>
        {unreadCount > 0 ? <NotificationActions mode="all" /> : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="You have no notifications yet." />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="space-y-2">
              <NotificationCard
                title={notification.title}
                message={notification.message}
                createdAt={notification.created_at}
                isRead={notification.is_read}
              />
              {!notification.is_read ? (
                <NotificationActions
                  mode="one"
                  notificationId={notification.id}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
