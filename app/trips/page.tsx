"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTripRequest,
  getMyTripRequests,
  type TripRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function TripsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    purpose: "",
    origin: "",
    destination: "",
    pickupTime: "",
    passengers: "1",
    department: "",
    durationMinutes: "60",
  });

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

    void loadTripRequests();
  }, [checkingSession, user, router]);

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

      setForm({
        purpose: "",
        origin: "",
        destination: "",
        pickupTime: "",
        passengers: "1",
        department: "",
        durationMinutes: "60",
      });
      setSuccess("Trip request submitted successfully.");
      await loadTripRequests();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession || loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading trip requests...</main>;
  }

  if (!user || user.role === "driver") return null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm text-emerald-300 hover:text-emerald-200"
        >
          ← Back to dashboard
        </button>

        <h1 className="mt-6 text-3xl font-bold">Trip requests</h1>
        <p className="mt-2 text-slate-400">
          Submit a transportation request and track its status.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-xl border border-slate-800 bg-slate-900 p-6 md:grid-cols-2">
          {[
            ["purpose", "Purpose"],
            ["origin", "Origin"],
            ["destination", "Destination"],
            ["department", "Department"],
          ].map(([name, label]) => (
            <label key={name} className="block">
              <span className="text-sm text-slate-300">{label}</span>
              <input
                required
                value={form[name as keyof typeof form]}
                onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              />
            </label>
          ))}

          <label className="block">
            <span className="text-sm text-slate-300">Pickup time</span>
            <input
              required
              type="datetime-local"
              value={form.pickupTime}
              onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Passengers</span>
            <input
              required
              min="1"
              type="number"
              value={form.passengers}
              onChange={(event) => setForm({ ...form, passengers: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Duration in minutes</span>
            <input
              required
              min="1"
              max="1440"
              type="number"
              value={form.durationMinutes}
              onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <div className="md:col-span-2">
            {error && <p role="alert" className="mb-3 text-sm text-red-300">{error}</p>}
            {success && <p className="mb-3 text-sm text-emerald-300">{success}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit trip request"}
            </button>
          </div>
        </form>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">My requests</h2>
          <div className="mt-4 space-y-3">
            {tripRequests.length === 0 && (
              <p className="rounded-xl border border-slate-800 p-5 text-slate-400">
                You have not submitted any trip requests yet.
              </p>
            )}

            {tripRequests.map((trip) => (
              <article key={trip.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{trip.purpose}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(trip.pickup_time).toLocaleString()} · {trip.passengers} passenger(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase text-amber-300">
                    {trip.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}