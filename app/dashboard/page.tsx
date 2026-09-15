"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getFleetSummary, type FleetSummary } from "../../lib/api";
import { NotificationBell } from "../../components/NotificationBell";
import { Logo } from "../../components/Logo";

type DashboardCardProps = {
  title: string;
  description: string;
  onClick?: () => void;
};

function CardGlyph() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6h16M4 12h16M4 18h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function DashboardCard({ title, description, onClick }: DashboardCardProps) {
  return (
    <article
      onClick={onClick}
      className={`osu-card group relative overflow-hidden p-5 transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--color-primary-300)] hover:shadow-[var(--shadow-card-hover)]"
          : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-700)] transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden="true"
      />
      <div className="flex items-start gap-3">
        <CardGlyph />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        </div>
      </div>
      {onClick && (
        <p className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-primary-700)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Open
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </p>
      )}
    </article>
  );
}

function MetricCard({
  label,
  value,
  accent = "var(--color-primary-600)",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <article className="osu-card relative overflow-hidden p-5">
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <p className="pl-2 text-xs font-medium tracking-wide text-[var(--color-text-secondary)] uppercase">
        {label}
      </p>
      <p className="mt-2 pl-2 text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}

function MetricSkeleton() {
  return (
    <div className="osu-card animate-pulse p-5">
      <div className="h-3 w-20 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-8 w-12 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, checkingSession, logout } = useAuth();

  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace("/login");
    }
  }, [checkingSession, user, router]);

  useEffect(() => {
    const canViewSummary =
      user?.role === "admin" ||
      user?.role === "staff" ||
      user?.role === "fleet_officer" ||
      user?.role === "viewer";

    if (!canViewSummary) {
      return;
    }

    // These states prepare the UI before the summary request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummaryLoading(true);
    setSummaryError("");

    getFleetSummary()
      .then(setSummary)
      .catch((error) => {
        setSummaryError(
          error instanceof Error ? error.message : "Could not load fleet summary"
        );
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [user]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(80%_60%_at_15%_0%,rgba(107,195,221,0.18),transparent),radial-gradient(60%_50%_at_85%_0%,rgba(27,87,64,0.08),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
        <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-6 border-b border-[var(--color-border)] bg-[var(--color-surface-50)]/85 px-4 py-4 backdrop-blur sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex items-center gap-4">
            <Logo size={40} />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
                Oromia State University
              </p>
              <h1 className="mt-0.5 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                Fleet Operations
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-0)] py-1 pr-1 pl-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-400)] text-[11px] font-semibold text-[var(--color-on-primary)]">
                {initials}
              </span>
              <span className="hidden pr-2 text-xs font-medium text-[var(--color-text-secondary)] sm:inline">
                {user.role}
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-0)] px-3.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-danger)]/40 hover:text-[var(--color-text-primary)]"
            >
              Log out
            </button>
          </div>
        </header>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Welcome back, <span className="text-[var(--color-text-primary)]">{user.name}</span>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 py-1 text-[var(--color-primary-700)]">
            Role: {user.role}
          </span>

          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 py-1 text-[var(--color-text-secondary)]">
            Campus: {user.campus_name ?? "Central Administration"}
          </span>
        </div>

        <section className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Signed in as</p>
            <p className="font-semibold text-[var(--color-text-primary)]">{user.email}</p>
          </div>
        </section>

        {(user.role === "admin" ||
          user.role === "staff" ||
          user.role === "fleet_officer" ||
          user.role === "viewer") && (
          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
                  {user.role === "viewer" ? "Read-only reports" : "Overview"}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                  Fleet summary
                </h2>
              </div>
              {summary && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Updated {new Date(summary.generatedAt).toLocaleString()}
                </p>
              )}
            </div>

            {summaryError && (
              <p role="alert" className="osu-alert-error mt-5">
                {summaryError}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {summaryLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <MetricSkeleton key={index} />
                ))}

              {summary && !summaryLoading && (
                <>
                  <MetricCard
                    label="Pending trips"
                    value={summary.trips.pending}
                    accent="var(--color-warning)"
                  />
                  <MetricCard
                    label="Active trips"
                    value={summary.trips.assigned + summary.trips.in_progress}
                    accent="var(--color-primary-600)"
                  />
                  <MetricCard
                    label="Available vehicles"
                    value={summary.vehicles.available}
                    accent="var(--color-success)"
                  />
                  <MetricCard
                    label="In maintenance"
                    value={summary.vehicles.maintenance}
                    accent="var(--color-danger)"
                  />
                  <MetricCard
                    label="Completed trips"
                    value={summary.trips.completed}
                    accent="var(--color-text-muted)"
                  />
                  <MetricCard
                    label="Unread alerts"
                    value={summary.notifications.unread}
                    accent="var(--color-warning)"
                  />
                </>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
            Workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">Quick access</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(user.role === "admin" ||
              user.role === "staff" ||
              user.role === "requester") && (
              <DashboardCard
                title="Trip requests"
                description="Create, review, filter, and track university transportation requests."
                onClick={() => router.push("/trips")}
              />
            )}

            {/* Admin-only cards */}
            {user.role === "admin" && (
              <>
                <DashboardCard
                  title="Manage all trip requests"
                  description="Review, approve, reject, and filter every trip request in the system."
                  onClick={() => router.push("/admin/trips")}
                />

                <DashboardCard
                  title="Vehicle management"
                  description="Manage vehicles, availability, maintenance records, and assignments."
                  onClick={() => router.push("/admin/vehicles")}
                />

                <DashboardCard
                  title="Live vehicle tracking"
                  description="View real-time vehicle positions on a map, refreshed every 15 seconds."
                  onClick={() => router.push("/admin/tracking")}
                />

                <DashboardCard
                  title="User management"
                  description="Create operational accounts and manage staff and driver access."
                  onClick={() => router.push("/admin/users")}
                />

                <DashboardCard
                  title="Audit history"
                  description="Review administrative changes and trip status history."
                  onClick={() => router.push("/admin/audit-logs")}
                />
              </>
            )}

            {/* Fleet Officer-only cards */}
            {user.role === "fleet_officer" && (
              <>
                <DashboardCard
                  title="Driver management"
                  description="Create, search, activate, and deactivate drivers in your campus."
                  onClick={() => router.push("/admin/drivers")}
                />

                <DashboardCard
                  title="Vehicle management"
                  description="Manage vehicles, fuel records, maintenance, receipts, and vehicle status."
                  onClick={() => router.push("/admin/vehicles")}
                />

                <DashboardCard
                  title="Trip operations"
                  description="Review trip requests, assign drivers and vehicles, and update trip status."
                  onClick={() => router.push("/admin/trips")}
                />
              </>
            )}

            {/* Driver-only cards */}
            {user.role === "driver" && (
              <>
                <DashboardCard
                  title="Assigned trips"
                  description="View trips assigned to you and check pickup details."
                  onClick={() => router.push("/driver/trips")}
                />

                <DashboardCard
                  title="Trip progress"
                  description="Start and complete assigned trips while recording final mileage and notes."
                  onClick={() => router.push("/driver/trips")}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}