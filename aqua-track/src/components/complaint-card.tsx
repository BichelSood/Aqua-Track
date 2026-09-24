export function ComplaintCard({
  complaintNumber,
  typeLabel,
  statusLabel,
  description,
  createdAt,
}: {
  complaintNumber: string;
  typeLabel: string;
  statusLabel: string;
  description: string;
  createdAt: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{complaintNumber}</p>
          <p className="text-sm text-muted-foreground">{typeLabel}</p>
        </div>
        <p className="text-sm font-medium">{statusLabel}</p>
      </div>
      <p className="mt-3 text-sm">{description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleString()}
      </p>
    </div>
  );
}
