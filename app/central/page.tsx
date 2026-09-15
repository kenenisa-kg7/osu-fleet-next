"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  getCentralFleetSummary,
  type CentralFleetSummary,
} from "../../lib/api";

export default function CentralDashboardPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [summary, setSummary] = useState<CentralFleetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCentralUser =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace("/login");
    }
  }, [checkingSession, user, router]);

  useEffect(() => {
    if (!isCentralUser) {
      return;
    }

    // These states prepare the UI before the summary request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    getCentralFleetSummary()
      .then(setSummary)
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load central fleet summary"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isCentralUser]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!isCentralUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-center">
        <div className="osu-card max-w-md p-8">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Access restricted
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You do not have permission to access the central dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 text-[var(--color-text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
                Oromia State University
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Central fleet dashboard
              </h1>

              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Signed in as{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {user.name}
                </span>{" "}
                · {user.role}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="osu-btn osu-btn-outline"
            >
              Campus dashboard
            </button>
          </div>

          <nav
            aria-label="Central fleet navigation"
            className="mt-6 flex flex-wrap gap-2"
          >
            <DashboardNavButton
              label="User directory"
              onClick={() => router.push("/central/users")}
            />
            <DashboardNavButton
              label="Campus directory"
              onClick={() => router.push("/central/campuses")}
              primary
            />
            <DashboardNavButton
              label="Vehicle report"
              onClick={() => router.push("/central/vehicles")}
            />
            <DashboardNavButton
              label="Trip report"
              onClick={() => router.push("/central/trips")}
            />
            <DashboardNavButton
              label="Fuel report"
              onClick={() => router.push("/central/fuel")}
            />
            <DashboardNavButton
              label="Maintenance report"
              onClick={() => router.push("/central/maintenance")}
            />
            <DashboardNavButton
              label="Utilization report"
              onClick={() => router.push("/central/utilization")}
            />
            <DashboardNavButton
              label="Combined report"
              onClick={() => router.push("/central/reports")}
              primary
            />
            <DashboardNavButton
              label="Audit history"
              onClick={() => router.push("/central/audit-logs")}
            />
          </nav>
        </header>

        {error && (
          <p
            role="alert"
            className="osu-alert-error mt-6 text-sm"
          >
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]"
              aria-hidden="true"
            />
            Loading central fleet data...
          </div>
        )}

        {summary && !loading && (
          <>
            <section
              aria-label="Fleet totals"
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Metric
                label="Total vehicles"
                value={summary.totals.vehicles}
              />
              <Metric
                label="Available vehicles"
                value={summary.totals.availableVehicles}
              />
              <Metric
                label="Total trips"
                value={summary.totals.trips}
              />
              <Metric
                label="Active trips"
                value={
                  summary.totals.assignedTrips +
                  summary.totals.inProgressTrips
                }
              />
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
                    Campuses
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Fleet by campus
                  </h2>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  Updated{" "}
                  {new Date(summary.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {summary.campuses.map((campus) => (
                  <article
                    key={campus.campus_id}
                    className="osu-card osu-card-hover p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                          Campus
                        </p>

                        <h3 className="mt-1 font-semibold text-[var(--color-text-primary)]">
                          {campus.campus_name}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {campus.campus_code} · {campus.city}
                        </p>
                      </div>

                      <span className="osu-badge osu-badge-success">
                        {campus.total_vehicles} vehicles
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Stat
                        label="Available"
                        value={campus.available_vehicles}
                      />
                      <Stat
                        label="Maintenance"
                        value={campus.maintenance_vehicles}
                      />
                      <Stat
                        label="Total trips"
                        value={campus.total_trips}
                      />
                      <Stat
                        label="Completed"
                        value={campus.completed_trips}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DashboardNavButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`osu-btn ${
        primary ? "osu-btn-primary" : "osu-btn-outline"
      }`}
    >
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="osu-card osu-card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {label}
        </p>

        <span
          className="h-2 w-2 rounded-full bg-[var(--color-primary-400)]"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-50)] p-3">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
