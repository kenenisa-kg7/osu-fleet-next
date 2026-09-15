"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  decideTripRequest,
  getAdminTripRequests,
  assignTripRequest,
  assignVehicleToTrip,
  getVehicles,
  getDrivers,
  type TripRequest,
  type Vehicle,
  type Driver,
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

// Same semantic status tokens used on the staff/driver trips pages, so a
// given status looks identical everywhere in the app.
const STATUS_STYLE: Record<string, { bg: string; text: string; accent: string }> = {
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
  bg: "var(--color-primary-100)",
  text: "var(--color-primary-700)",
  accent: "var(--color-primary-600)",
};

export default function AdminTripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Record<string, string>>({});
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function loadTrips() {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminTripRequests(statusFilter);
      setTrips(result.tripRequests);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load trips");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignmentOptions() {
    try {
      const [vehicleResult, driverResult] = await Promise.all([
        getVehicles("available"),
        getDrivers(),
      ]);
      setVehicles(vehicleResult.vehicles);
      setDrivers(driverResult.drivers.filter((driver) => driver.is_active));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load vehicles/drivers"
      );
    }
  }

  useEffect(() => {
    if (checkingSession) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "fleet_officer") {
      router.replace("/dashboard");
      return;
    }

    // This effect intentionally loads trips when the page or status filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrips();

    void loadAssignmentOptions();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, user, router, statusFilter]);

  async function handleDecision(tripId: string, status: "approved" | "rejected") {
    try {
      setError("");
      await decideTripRequest(tripId, status);
      await loadTrips();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update trip");
    }
  }

  async function handleAssign(trip: TripRequest) {
    const vehicleId = selectedVehicle[trip.id];
    const driverId = selectedDriver[trip.id];

    if (!trip.vehicle_id && !vehicleId) {
      setError("Select a vehicle before assigning");
      return;
    }
    if (!driverId) {
      setError("Select a driver before assigning");
      return;
    }

    try {
      setAssigningId(trip.id);
      setError("");

      // Vehicle must be assigned first — assigning a driver moves the trip
      // out of "approved", after which the vehicle endpoint would reject it.
      if (!trip.vehicle_id && vehicleId) {
        await assignVehicleToTrip(trip.id, vehicleId);
      }

      await assignTripRequest(trip.id, driverId);

      await loadTrips();
      await loadAssignmentOptions();
      setSelectedVehicle((prev) => {
        const next = { ...prev };
        delete next[trip.id];
        return next;
      });
      setSelectedDriver((prev) => {
        const next = { ...prev };
        delete next[trip.id];
        return next;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not assign trip");
      // Refresh so partial progress (e.g. vehicle assigned, driver failed) is visible
      await loadTrips();
    } finally {
      setAssigningId(null);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-50)] p-8 text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (
    !user ||
    (user.role !== "admin" && user.role !== "fleet_officer")
  ) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(27,87,64,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl p-6 sm:p-10">
        <BackLink onClick={() => router.push("/dashboard")} />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
              {user.role === "fleet_officer" ? "Fleet Officer workspace" : "Administrator workspace"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Trip requests</h1>
          </div>

          <label className="text-sm text-[var(--color-text-secondary)]">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="osu-input ml-3 inline-block w-auto"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="osu-alert-error mt-5">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-4">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <TripCardSkeleton key={index} />
            ))}

          {!loading && trips.length === 0 && (
            <p className="osu-card p-6 text-[var(--color-text-muted)]">
              No trip requests match this filter.
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
                  <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{trip.purpose}</h2>
                      <p className="mt-1 text-[var(--color-text-secondary)]">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        {new Date(trip.pickup_time).toLocaleString()} · {trip.passengers} passenger(s) · {trip.department}
                      </p>
                    </div>

                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {trip.status}
                    </span>
                  </div>

                  {trip.status === "pending" && (
                    <div className="mt-5 ml-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleDecision(trip.id, "approved")}
                        className="osu-btn osu-btn-primary text-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDecision(trip.id, "rejected")}
                        className="osu-btn text-sm"
                        style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {trip.status === "approved" && (
                    <div className="mt-5 ml-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-50)] p-4">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Assign vehicle and driver
                      </p>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        {trip.vehicle_id ? (
                          <p className="flex flex-1 items-center rounded-lg border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] px-3 py-2 text-sm text-[var(--color-primary-700)]">
                            Vehicle already assigned ✓
                          </p>
                        ) : (
                          <select
                            value={selectedVehicle[trip.id] ?? ""}
                            onChange={(event) =>
                              setSelectedVehicle((prev) => ({
                                ...prev,
                                [trip.id]: event.target.value,
                              }))
                            }
                            className="osu-input flex-1"
                          >
                            <option value="">Select vehicle</option>
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.registration_number} — {vehicle.make} {vehicle.model} (cap {vehicle.capacity})
                              </option>
                            ))}
                          </select>
                        )}

                        <select
                          value={selectedDriver[trip.id] ?? ""}
                          onChange={(event) =>
                            setSelectedDriver((prev) => ({
                              ...prev,
                              [trip.id]: event.target.value,
                            }))
                          }
                          className="osu-input flex-1"
                        >
                          <option value="">Select driver</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.email})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={assigningId === trip.id}
                          onClick={() => void handleAssign(trip)}
                          className="osu-btn osu-btn-primary text-sm"
                        >
                          {assigningId === trip.id ? "Assigning..." : "Assign"}
                        </button>
                      </div>

                      {!trip.vehicle_id && vehicles.length === 0 && (
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">No available vehicles right now.</p>
                      )}
                      {drivers.length === 0 && (
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">No active drivers found.</p>
                      )}
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