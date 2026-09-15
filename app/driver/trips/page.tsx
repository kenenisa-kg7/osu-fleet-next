"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeDriverTrip,
  getDriverTripRequests,
  updateDriverTripStatus,
  type TripRequest,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 text-sm text-[var(--color-primary-700)] transition-colors hover:text-[var(--color-primary-800)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to dashboard
    </button>
  );
}

function TripCardSkeleton() {
  return (
    <div className="osu-card animate-pulse p-6">
      <div className="h-4 w-1/3 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-3 w-1/2 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-2 h-3 w-1/4 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

// Same semantic status tokens used on the staff trips page, so a given
// status always looks the same color across every role's view.
const STATUS_STYLE: Record<string, { bg: string; text: string; accent: string; label?: string }> = {
  assigned: {
    bg: "var(--color-primary-100)",
    text: "var(--color-primary-800)",
    accent: "var(--color-primary-700)",
  },
  in_progress: {
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning)",
    accent: "var(--color-warning)",
    label: "in progress",
  },
  completed: {
    bg: "var(--color-surface-100)",
    text: "var(--color-text-secondary)",
    accent: "var(--color-text-muted)",
  },
};

const DEFAULT_STATUS_STYLE = {
  bg: "var(--color-primary-100)",
  text: "var(--color-primary-700)",
  accent: "var(--color-primary-600)",
};

export default function DriverTripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mileage, setMileage] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadTrips() {
    try {
      setLoading(true);
      setError("");
      const result = await getDriverTripRequests();
      setTrips(result.tripRequests);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load assigned trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingSession) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "driver") {
      router.replace("/dashboard");
      return;
    }
    // This effect intentionally loads driver trips when the page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrips();
  }, [checkingSession, user, router]);

  async function startTrip(tripId: string) {
    try {
      setUpdatingId(tripId);
      setError("");
      await updateDriverTripStatus(tripId, "in_progress");
      await loadTrips();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not start trip");
    } finally {
      setUpdatingId(null);
    }
  }

  async function finishTrip(tripId: string) {
    const endMileage = Number(mileage[tripId]);

    if (!Number.isFinite(endMileage) || endMileage < 0) {
      setError("Enter a valid ending mileage.");
      return;
    }

    try {
      setUpdatingId(tripId);
      setError("");
      await completeDriverTrip(tripId, endMileage, notes[tripId] || "");
      await loadTrips();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not complete trip");
    } finally {
      setUpdatingId(null);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-50)] p-8 text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (!user || user.role !== "driver") return null;

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(27,87,64,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl p-6 sm:p-10">
        <BackLink onClick={() => router.push("/dashboard")} />

        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
          Driver workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Assigned trips</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Welcome, {user.name}. Manage your assigned OSU trips below.
        </p>

        {error && (
          <p role="alert" className="osu-alert-error mt-6">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-5">
          {loading &&
            Array.from({ length: 2 }).map((_, index) => (
              <TripCardSkeleton key={index} />
            ))}

          {!loading && trips.length === 0 && (
            <p className="osu-card p-6 text-[var(--color-text-muted)]">
              No trips are currently assigned to you.
            </p>
          )}

          {!loading &&
            trips.map((trip) => {
              const statusStyle = STATUS_STYLE[trip.status] ?? DEFAULT_STATUS_STYLE;
              return (
                <article key={trip.id} className="osu-card osu-card-hover relative overflow-hidden p-6">
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: statusStyle.accent }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{trip.purpose}</h2>
                      <p className="mt-2 text-[var(--color-text-secondary)]">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        Pickup: {new Date(trip.pickup_time).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Passengers: {trip.passengers} · Department: {trip.department}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {statusStyle.label ?? trip.status}
                    </span>
                  </div>

                  {trip.status === "assigned" && (
                    <button
                      type="button"
                      disabled={updatingId === trip.id}
                      onClick={() => void startTrip(trip.id)}
                      className="osu-btn osu-btn-primary mt-5 ml-2"
                    >
                      {updatingId === trip.id ? "Starting..." : "Start trip"}
                    </button>
                  )}

                  {trip.status === "in_progress" && (
                    <div className="mt-5 ml-2 grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="text-sm text-[var(--color-text-secondary)]">Ending mileage</span>
                        <input
                          type="number"
                          min="0"
                          value={mileage[trip.id] || ""}
                          onChange={(event) => setMileage({ ...mileage, [trip.id]: event.target.value })}
                          className="osu-input mt-2"
                        />
                      </label>
                      <label>
                        <span className="text-sm text-[var(--color-text-secondary)]">Completion notes</span>
                        <textarea
                          value={notes[trip.id] || ""}
                          onChange={(event) => setNotes({ ...notes, [trip.id]: event.target.value })}
                          className="osu-input mt-2"
                          rows={3}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={updatingId === trip.id}
                        onClick={() => void finishTrip(trip.id)}
                        className="osu-btn osu-btn-primary sm:col-span-2"
                      >
                        {updatingId === trip.id ? "Completing..." : "Complete trip"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}