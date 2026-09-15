"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCentralFuelReport,
  type CentralFuelReport,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function CentralFuelReportPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [report, setReport] = useState<CentralFuelReport | null>(null);
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

      const data = await getCentralFuelReport({
        from: from || undefined,
        to: to || undefined,
      });

      setReport(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load central fuel report"
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
              Organization-wide fuel report
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Fuel usage and cost across all OSU campuses.
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

            Loading fuel report...
          </div>
        )}

        {report && !loading && (
          <>
            <section
              aria-label="Fuel report summary"
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Metric
                label="Fuel records"
                value={Number(
                  report.summary.record_count
                ).toLocaleString()}
              />

              <Metric
                label="Total liters"
                value={Number(
                  report.summary.total_liters
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              />

              <Metric
                label="Total cost"
                value={formatCurrency(report.summary.total_cost)}
              />

              <Metric
                label="Average cost per liter"
                value={formatCurrency(
                  report.summary.average_cost_per_liter
                )}
              />
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                    Campus analysis
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Fuel usage by campus
                  </h2>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  {report.campuses.length} campus
                  {report.campuses.length === 1 ? "" : "es"} included
                </p>
              </div>

              <div className="osu-card mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-5 py-4">Campus</th>
                        <th className="px-5 py-4">Records</th>
                        <th className="px-5 py-4">Liters</th>
                        <th className="px-5 py-4">Total cost</th>
                        <th className="px-5 py-4">Cost per liter</th>
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
                              {campus.campus_code}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {campus.record_count}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {Number(
                              campus.total_liters
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {formatCurrency(campus.total_cost)}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {formatCurrency(
                              campus.average_cost_per_liter
                            )}
                          </td>
                        </tr>
                      ))}

                      {report.campuses.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]"
                          >
                            No campus fuel data found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                    Transaction log
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Fuel transaction details
                  </h2>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  {report.records.length} record
                  {report.records.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="osu-card mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Vehicle</th>
                        <th className="px-5 py-4">Campus</th>
                        <th className="px-5 py-4">Fuel type</th>
                        <th className="px-5 py-4">Liters</th>
                        <th className="px-5 py-4">Cost</th>
                        <th className="px-5 py-4">Station</th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.records.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--color-text-secondary)]">
                            {new Date(
                              record.fueled_at
                            ).toLocaleString()}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-[var(--color-text-primary)]">
                              {record.registration_number}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {record.make} {record.model}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {record.campus_name}
                          </td>

                          <td className="px-5 py-4 capitalize text-[var(--color-text-secondary)]">
                            {record.fuel_type}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {Number(record.liters).toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {formatCurrency(record.cost)}
                          </td>

                          <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                            {record.station_name || "Not provided"}
                          </td>
                        </tr>
                      ))}

                      {report.records.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]"
                          >
                            No fuel records found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  });
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
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

      <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}
