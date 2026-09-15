"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTripRequest,
  getMyTripRequests,
  type TripRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

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

function TripSkeleton() {
  return (
    <div className="osu-card animate-pulse p-5">
      <div className="h-4 w-1/3 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-3 w-1/2 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

// Status → semantic token mapping. No arbitrary hex here — everything
// resolves to the same tokens used by badges/alerts elsewhere in the app.
const STATUS_STYLE: Record<string, { bg: string; text: string; accent: string; label?: string }> = {
  pending: {
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning)",
    accent: "var(--color-warning)",
  },
  approved: {
    bg: "var(--color-primary-100)",
    text: "var(--color-primary-700)",
    accent: "var(--color-primary-600)",
  },
  assigned: {
    bg: "var(--color-primary-100)",
    text: "var(--color-primary-800)",
    accent: "var(--color-primary-700)",
  },
  in_progress: {
    bg: "var(--color-primary-100)",
    text: "var(--color-primary-700)",
    accent: "var(--color-primary-600)",
    label: "in progress",
  },
  completed: {
    bg: "var(--color-surface-100)",
    text: "var(--color-text-secondary)",
    accent: "var(--color-text-muted)",
  },
  cancelled: {
    bg: "var(--color-surface-100)",
    text: "var(--color-text-secondary)",
    accent: "var(--color-text-muted)",
  },
  rejected: {
    bg: "var(--color-danger-bg)",
    text: "var(--color-danger)",
    accent: "var(--color-danger)",
  },
};

const DEFAULT_STATUS_STYLE = {
  bg: "var(--color-surface-100)",
  text: "var(--color-text-secondary)",
  accent: "var(--color-primary-600)",
};

const FIELD_LABELS: Array<[keyof typeof INITIAL_FORM, string]> = [
  ["purpose", "Purpose"],
  ["origin", "Origin"],
  ["destination", "Destination"],
  ["department", "Department"],
];

const INITIAL_FORM = {
  purpose: "",
  origin: "",
  destination: "",
  pickupTime: "",
  passengers: "1",
  department: "",
  durationMinutes: "60",
};

export default function TripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  async function loadTripRequests() {
    try {
      setLoading(true);
      const result = await getMyTripRequests();
      setTripRequests(result.tripRequests);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load requests");
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

    if (user.role === "driver") {
      router.replace("/dashboard");
      return;
    }

    // This effect intentionally loads trip requests when the page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTripRequests();
  }, [checkingSession, user, router]);

  const canCreateRequests =
    user?.role === "admin" ||
    user?.role === "staff" ||
    user?.role === "requester";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createTripRequest({
        purpose: form.purpose,
        origin: form.origin,
        destination: form.destination,
        pickupTime: new Date(form.pickupTime).toISOString(),
        passengers: Number(form.passengers),
        department: form.department,
        durationMinutes: Number(form.durationMinutes),
      });

      setForm(INITIAL_FORM);
      setSuccess("Trip request submitted successfully.");
      await loadTripRequests();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-50)] p-8 text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (!user || user.role === "driver") return null;

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(179,38,30,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl p-6 sm:p-10">
        <BackLink onClick={() => router.push("/dashboard")} />

        <h1 className="mt-6 text-3xl font-bold text-[var(--color-text-primary)]">Trip requests</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {user.role === "viewer"
            ? "Read-only access is provided through the fleet summary."
            : "Submit a transportation request and track its status."}
        </p>

        {canCreateRequests && (
          <form onSubmit={handleSubmit} className="osu-card mt-8 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
              New request
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {FIELD_LABELS.map(([name, label]) => (
                <label key={name} className="block">
                  <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                  <input
                    required
                    value={form[name]}
                    onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                    className="osu-input mt-2"
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-sm text-[var(--color-text-secondary)]">Pickup time</span>
                <input
                  required
                  type="datetime-local"
                  value={form.pickupTime}
                  onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}
                  className="osu-input mt-2"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[var(--color-text-secondary)]">Passengers</span>
                <input
                  required
                  min="1"
                  type="number"
                  value={form.passengers}
                  onChange={(event) => setForm({ ...form, passengers: event.target.value })}
                  className="osu-input mt-2"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[var(--color-text-secondary)]">Duration in minutes</span>
                <input
                  required
                  min="1"
                  max="1440"
                  type="number"
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                  className="osu-input mt-2"
                />
              </label>
            </div>

            <div className="mt-5">
              {error && (
                <p role="alert" className="osu-alert-error mb-3 text-sm">
                  {error}
                </p>
              )}
              {success && (
                <p className="osu-alert-success mb-3 flex items-center gap-1.5 text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {success}
                </p>
              )}
              <button type="submit" disabled={submitting} className="osu-btn osu-btn-primary">
                {submitting ? "Submitting..." : "Submit trip request"}
              </button>
            </div>
          </form>
        )}

        <section className="mt-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
            Activity
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">My requests</h2>

          <div className="mt-4 space-y-3">
            {loading &&
              Array.from({ length: 3 }).map((_, index) => <TripSkeleton key={index} />)}

            {!loading && tripRequests.length === 0 && (
              <p className="osu-card p-5 text-[var(--color-text-muted)]">
                You have not submitted any trip requests yet.
              </p>
            )}

            {!loading &&
              tripRequests.map((trip) => {
                const statusStyle = STATUS_STYLE[trip.status] ?? DEFAULT_STATUS_STYLE;
                return (
                  <article
                    key={trip.id}
                    className="osu-card osu-card-hover relative overflow-hidden p-5"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ backgroundColor: statusStyle.accent }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)]">{trip.purpose}</h3>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {new Date(trip.pickup_time).toLocaleString()} · {trip.passengers} passenger(s)
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {statusStyle.label ?? trip.status}
                      </span>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </div>
    </main>
  );
}