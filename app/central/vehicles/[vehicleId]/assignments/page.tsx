"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import {
  getVehicleAssignmentHistory,
  type VehicleAssignmentHistoryResponse,
} from "../../../../../lib/api";

function formatDate(value: string | null) {
  if (!value) {
    return "Not received yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VehicleAssignmentHistoryPage() {
  const router = useRouter();
  const params = useParams<{ vehicleId: string }>();
  const { user, checkingSession } = useAuth();

  const [result, setResult] =
    useState<VehicleAssignmentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const vehicleId = params.vehicleId;

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  useEffect(() => {
    if (checkingSession) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccess || !vehicleId) {
      return;
    }

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const data = await getVehicleAssignmentHistory(vehicleId);
        setResult(data);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load vehicle assignment history"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, [canAccess, checkingSession, router, user, vehicleId]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Loading assignment history...
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
            You do not have permission to access this page.
          </p>
        </div>
      </main>
    );
  }

  if (!vehicleId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-center">
        <div className="osu-card max-w-md p-8">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Vehicle unavailable
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Vehicle ID is missing.
          </p>

          <button
            type="button"
            onClick={() => router.push("/central/vehicles")}
            className="osu-btn osu-btn-primary mt-6"
          >
            Back to vehicles
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]"
            aria-hidden="true"
          />
          Loading assignment history...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 text-[var(--color-text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
              Oromia State University
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Vehicle allocation history
            </h1>

            {result && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {result.vehicle.registration_number}
                </span>{" "}
                · {result.vehicle.make} {result.vehicle.model}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/central/vehicles")}
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
            Back to vehicles
          </button>
        </header>

        {error && (
          <div className="osu-alert-error mt-6 text-sm">
            <p role="alert">{error}</p>

            <button
              type="button"
              onClick={() => router.push("/central/vehicles")}
              className="osu-btn osu-btn-outline mt-4 px-3 py-2 text-xs"
            >
              Return to vehicle report
            </button>
          </div>
        )}

        {result && !error && (
          <section className="osu-card mt-8 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                  Vehicle movements
                </p>

                <h2 className="mt-1 font-semibold text-[var(--color-text-primary)]">
                  Campus movement history
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {result.assignments.length} allocation
                  {result.assignments.length === 1 ? "" : "s"} recorded
                </p>
              </div>

              <span className="osu-badge osu-badge-neutral">
                {result.assignments.length === 0
                  ? "No movements"
                  : `${result.assignments.length} record${
                      result.assignments.length === 1 ? "" : "s"
                    }`}
              </span>
            </div>

            {result.assignments.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 8v4m0 4h.01M5.5 20h13a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.77 17a2 2 0 0 0 1.73 3Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                  No allocation history is available for this vehicle.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-5 py-4">From campus</th>
                      <th className="px-5 py-4">To campus</th>
                      <th className="px-5 py-4">Reason</th>
                      <th className="px-5 py-4">Assigned by</th>
                      <th className="px-5 py-4">Assigned at</th>
                      <th className="px-5 py-4">Receipt</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.assignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                          {assignment.from_campus_name ? (
                            <>
                              <p className="text-[var(--color-text-primary)]">
                                {assignment.from_campus_name}
                              </p>

                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {assignment.from_campus_code}
                              </p>
                            </>
                          ) : (
                            <span className="font-medium text-[var(--color-secondary-700)]">
                              Central fleet
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                          <p className="text-[var(--color-text-primary)]">
                            {assignment.to_campus_name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {assignment.to_campus_code}
                          </p>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-[var(--color-text-secondary)]">
                          {assignment.reason}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-[var(--color-text-primary)]">
                            {assignment.assigned_by_name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {assignment.assigned_by_email}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-[var(--color-text-secondary)]">
                          {formatDate(assignment.assigned_at)}
                        </td>

                        <td className="px-5 py-4">
                          {assignment.received_at ? (
                            <>
                              <span className="osu-badge osu-badge-success">
                                Received
                              </span>

                              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                                {formatDate(assignment.received_at)}
                              </p>

                              {assignment.received_by_name && (
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                  By {assignment.received_by_name}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="osu-badge osu-badge-warning">
                              Awaiting receipt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
