type BadgeVariant = "success" | "warning" | "danger" | "neutral";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: "osu-badge-success",
  warning: "osu-badge-warning",
  danger: "osu-badge-danger",
  neutral: "osu-badge-neutral",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return <span className={`osu-badge ${VARIANT_CLASS[variant]}`}>{children}</span>;
}

/**
 * Central place to map every status string used across the app (vehicles,
 * trips, maintenance, etc.) to a badge variant. Add new statuses here rather
 * than re-deriving colors per page.
 */
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // vehicles
  available: "success",
  assigned: "neutral",
  maintenance: "warning",
  inactive: "danger",
  // trips
  pending: "warning",
  in_progress: "neutral",
  completed: "success",
  rejected: "danger",
  cancelled: "danger",
  // generic
  active: "success",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? "neutral";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}