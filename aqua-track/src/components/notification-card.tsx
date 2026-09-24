type NotificationCardProps = {
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
};

export function NotificationCard({
  title,
  message,
  createdAt,
  isRead = false,
}: NotificationCardProps) {
  return (
    <div
      className={`rounded-[1.125rem] border p-4 transition-colors duration-200 ${isRead ? "border-border bg-transparent" : "border-accent/25 bg-accent/8"}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleString()}
      </p>
    </div>
  );
}
