"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  decideTripRequest,
  getAdminTripRequests,
  type TripRequest,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function AdminTripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (checkingSession) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    void loadTrips();
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

  if (checkingSession || loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading trip requests...</main>;
  }

  if (!user || user.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm text-emerald-300"
        >
          ← Back to dashboard
        </button>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-emerald-300">Administrator workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Trip requests</h1>
          </div>

          <label className="text-sm text-slate-300">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="ml-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
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
          <p role="alert" className="mt-5 rounded-lg bg-red-400/10 p-4 text-red-300">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-4">
          {trips.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-6 text-slate-400">
              No trip requests match this filter.
            </p>
          )}

          {trips.map((trip) => (
            <article key={trip.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{trip.purpose}</h2>
                  <p className="mt-1 text-slate-300">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(trip.pickup_time).toLocaleString()} · {trip.passengers} passenger(s) · {trip.department}
                  </p>
                </div>

                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs uppercase text-amber-300">
                  {trip.status}
                </span>
              </div>

              {trip.status === "pending" && (
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDecision(trip.id, "approved")}
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision(trip.id, "rejected")}
                    className="rounded-lg bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300"
                  >
                    Reject
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