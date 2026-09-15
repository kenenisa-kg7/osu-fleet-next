"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  getCentralTrips,
  getCampuses,
  type Campus,
  type CentralTripPage,
} from "../../../lib/api";

function escapeCsvValue(value: unknown): string {
  const text =
    value === null || value === undefined ? "" : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
) {
  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function CentralTripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [result, setResult] = useState<CentralTripPage | null>(null);
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  async function loadTrips() {
    setLoading(true);
    setError("");

    try {
      const data = await getCentralTrips({
        campusId,
        status,
        department,
        destination,
      });

      setResult(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load trip report"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExportTrips() {
    if (!result || result.trips.length === 0) {
      setError("There are no trips to export.");
      return;
    }

    downloadCsv(
      `osu-central-trips-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      [
        "Trip ID",
        "Purpose",
        "Origin",
        "Destination",
        "Campus",
        "Campus Code",
        "Requester",
        "Department",
        "Status",
        "Driver",
        "Passengers",
        "Pickup Time",
      ],
      result.trips.map((trip) => [
        trip.id,
        trip.purpose,
        trip.origin,
        trip.destination,
        trip.campus_name,
        trip.campus_code,
        trip.requester_name ?? "Unknown",
        trip.department,
        trip.status,
        trip.driver_name ?? "Not assigned",
        trip.passengers,
        new Date(trip.pickup_time).toISOString(),
      ])
    );
  }

  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace("/login");
    }
  }, [checkingSession, user, router]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    getCampuses()
      .then(setCampuses)
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load campuses"
        );
      });
  }, [canAccess]);

  if (checkingSession || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Checking your session...
      </main>
    );
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

  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 text-[var(--color-text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
              Oromia State University
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Central trip report
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Review transport requests across all OSU campuses.
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
            Central dashboard
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadTrips();
          }}
          className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-5"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              Department
            </span>

            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Search department"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              Destination
            </span>

            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Search destination"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              Campus
            </span>

            <select
              value={campusId}
              onChange={(event) => setCampusId(event.target.value)}
              className="osu-input"
            >
              <option value="">All campuses</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name} — {campus.city}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              Status
            </span>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="osu-input"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              Search trips
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

            Loading trip report...
          </div>
        )}

        {result && !loading && (
          <section className="osu-card mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                  Transport activity
                </p>

                <h2 className="mt-1 font-semibold text-[var(--color-text-primary)]">
                  Trip requests
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {result.pagination.total} total trips
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportTrips}
                disabled={result.trips.length === 0}
                className="osu-btn osu-btn-ghost-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-5 py-4">Trip</th>
                    <th className="px-5 py-4">Campus</th>
                    <th className="px-5 py-4">Requester</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Pickup</th>
                  </tr>
                </thead>

                <tbody>
                  {result.trips.map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {trip.purpose}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {trip.origin} → {trip.destination}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-[var(--color-text-primary)]">
                          {trip.campus_name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {trip.campus_code}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                        {trip.requester_name ?? "Unknown"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="osu-badge osu-badge-success">
                          {trip.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                        {trip.driver_name ?? "Not assigned"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--color-text-secondary)]">
                        {new Date(trip.pickup_time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.trips.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No trips found.
                </p>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Try changing the filters and search again.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
