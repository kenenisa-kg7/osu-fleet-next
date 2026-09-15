"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCentralUtilizationReport,
  type CentralUtilizationReport,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function CentralUtilizationReportPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [report, setReport] =
    useState<CentralUtilizationReport | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCentralUtilizationReport({
        from: from || undefined,
        to: to || undefined,
      });

      setReport(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load utilization report"
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (checkingSession) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccess) {
      return;
    }

    // Intentional initial data load after authorization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport();
  }, [checkingSession, user, canAccess, router, loadReport]);

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

  if (!canAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-center">
        <div className="osu-card max-w-md p-8">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Access restricted
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You do not have permission to access this report.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 text-[var(--color-text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
              Oromia State University
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Vehicle utilization comparison
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Compare how effectively each campus uses its active vehicles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/central")}
            className="osu-btn osu-btn-outline"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to central dashboard
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadReport();
          }}
          className="osu-card mt-8 grid gap-4 p-5 sm:grid-cols-3 sm:p-6"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              From date
            </span>

            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              To date
            </span>

            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="osu-input"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              Apply filters
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="osu-alert-error mt-6 text-sm">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]"
              aria-hidden="true"
            />

            Loading utilization report...
          </div>
        )}

        {report && !loading && (
          <>
            <section
              aria-label="Utilization summary"
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <Metric
                label="Active vehicles"
                value={report.summary.total_vehicles.toLocaleString()}
              />

              <Metric
                label="Vehicles used"
                value={report.summary.vehicles_used.toLocaleString()}
              />

              <Metric
                label="Total trips"
                value={report.summary.total_trips.toLocaleString()}
              />

              <Metric
                label="Completed trips"
                value={report.summary.completed_trips.toLocaleString()}
              />

              <Metric
                label="Utilization"
                value={`${Number(
                  report.summary.utilization_percentage
                ).toFixed(2)}%`}
                accent
              />
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                    Campus comparison
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Utilization by campus
                  </h2>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  {report.campuses.length} campus
                  {report.campuses.length === 1 ? "" : "es"} included
                </p>
              </div>

              <div className="osu-card mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-5 py-4">Campus</th>
                        <th className="px-5 py-4">Active vehicles</th>
                        <th className="px-5 py-4">Vehicles used</th>
                        <th className="px-5 py-4">Total trips</th>
                        <th className="px-5 py-4">Completed</th>
                        <th className="px-5 py-4">Active trips</th>
                        <th className="px-5 py-4">Utilization</th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.campuses.map((campus) => (
                        <tr
                          key={campus.campus_id}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-[var(--color-text-primary)]">
                              {campus.campus_name}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {campus.campus_code} · {campus.city}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.total_vehicles}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.vehicles_used}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.total_trips}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.completed_trips}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.active_trips}
                          </td>

                          <td className="px-5 py-4">
                            <span className="osu-badge osu-badge-success">
                              {Number(
                                campus.utilization_percentage
                              ).toFixed(2)}
                              %
                            </span>
                          </td>
                        </tr>
                      ))}

                      {report.campuses.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]"
                          >
                            No campus utilization data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="osu-card mt-10 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3v18M3 12h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                    Methodology
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    How utilization is calculated
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    Utilization is the percentage of active vehicles that have
                    been assigned to at least one trip in the selected period.
                    Inactive vehicles are excluded from the calculation.
                  </p>

                  <p className="mt-3 inline-flex rounded-lg bg-[var(--color-primary-50)] px-3 py-2 text-sm font-medium text-[var(--color-primary-800)]">
                    Formula: vehicles used ÷ active vehicles × 100
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <article className="osu-card osu-card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {label}
        </p>

        <span
          className={`h-2 w-2 rounded-full ${
            accent
              ? "bg-[var(--color-secondary-400)]"
              : "bg-[var(--color-primary-400)]"
          }`}
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}
