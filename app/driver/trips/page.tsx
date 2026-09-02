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

  if (checkingSession || loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading assigned trips...</main>;
  }

  if (!user || user.role !== "driver") return null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm text-emerald-300"
        >
          ← Back to dashboard
        </button>

        <p className="mt-6 text-sm text-emerald-300">Driver workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Assigned trips</h1>
        <p className="mt-2 text-slate-400">Welcome, {user.name}. Manage your assigned OSU trips below.</p>

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-400/10 p-4 text-red-300">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-5">
          {trips.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-6 text-slate-400">
              No trips are currently assigned to you.
            </p>
          )}

          {trips.map((trip) => (
            <article key={trip.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{trip.purpose}</h2>
                  <p className="mt-2 text-slate-300">{trip.origin} → {trip.destination}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Pickup: {new Date(trip.pickup_time).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Passengers: {trip.passengers} · Department: {trip.department}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs uppercase text-emerald-300">
                  {trip.status}
                </span>
              </div>

              {trip.status === "assigned" && (
                <button
                  type="button"
                  disabled={updatingId === trip.id}
                  onClick={() => void startTrip(trip.id)}
                  className="mt-5 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {updatingId === trip.id ? "Starting..." : "Start trip"}
                </button>
              )}

              {trip.status === "in_progress" && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm text-slate-300">Ending mileage</span>
                    <input
                      type="number"
                      min="0"
                      value={mileage[trip.id] || ""}
                      onChange={(event) => setMileage({ ...mileage, [trip.id]: event.target.value })}
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    />
                  </label>
                  <label>
                    <span className="text-sm text-slate-300">Completion notes</span>
                    <textarea
                      value={notes[trip.id] || ""}
                      onChange={(event) => setNotes({ ...notes, [trip.id]: event.target.value })}
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                      rows={3}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={updatingId === trip.id}
                    onClick={() => void finishTrip(trip.id)}
                    className="rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 sm:col-span-2 disabled:opacity-60"
                  >
                    {updatingId === trip.id ? "Completing..." : "Complete trip"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}