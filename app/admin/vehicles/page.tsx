"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createVehicle,
  getVehicles,
  updateVehicleStatus,
  type Vehicle,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function AdminVehiclesPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    manufactureYear: "",
    capacity: "",
  });

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");
      const result = await getVehicles(statusFilter);
      setVehicles(result.vehicles);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load vehicles");
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
    void loadVehicles();
  }, [checkingSession, user, router, statusFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createVehicle({
        registrationNumber: form.registrationNumber,
        make: form.make,
        model: form.model,
        manufactureYear: form.manufactureYear
          ? Number(form.manufactureYear)
          : undefined,
        capacity: Number(form.capacity),
      });

      setForm({
        registrationNumber: "",
        make: "",
        model: "",
        manufactureYear: "",
        capacity: "",
      });
      setSuccess("Vehicle created successfully.");
      await loadVehicles();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create vehicle");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    vehicleId: string,
    status: "available" | "maintenance" | "inactive"
  ) {
    try {
      setError("");
      await updateVehicleStatus(vehicleId, status);
      await loadVehicles();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update vehicle");
    }
  }

  if (checkingSession || loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading vehicles...</main>;
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
            <h1 className="mt-2 text-3xl font-bold">Vehicle management</h1>
          </div>

          <label className="text-sm text-slate-300">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="ml-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            >
              <option value="">All vehicles</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-red-400/10 p-4 text-red-300">
            {error}
          </p>
        )}
        {success && <p className="mt-5 text-emerald-300">{success}</p>}

        <form onSubmit={handleCreate} className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 md:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Registration"
            value={form.registrationNumber}
            onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
          <input
            required
            placeholder="Make"
            value={form.make}
            onChange={(event) => setForm({ ...form, make: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
          <input
            required
            placeholder="Model"
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
          <input
            type="number"
            placeholder="Year"
            value={form.manufactureYear}
            onChange={(event) => setForm({ ...form, manufactureYear: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
          <input
            required
            min="1"
            type="number"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60 md:col-span-2 lg:col-span-5"
          >
            {submitting ? "Creating..." : "Add vehicle"}
          </button>
        </form>

        <section className="mt-8 space-y-4">
          {vehicles.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-6 text-slate-400">
              No vehicles match this filter.
            </p>
          )}

          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{vehicle.registration_number}</h2>
                  <p className="mt-1 text-slate-300">
                    {vehicle.make} {vehicle.model} · Capacity {vehicle.capacity}
                  </p>
                  {vehicle.manufacture_year && (
                    <p className="mt-1 text-sm text-slate-500">Year: {vehicle.manufacture_year}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs uppercase text-emerald-300">
                    {vehicle.status}
                  </span>
                  <select
                    value={vehicle.status}
                    disabled={vehicle.status === "assigned"}
                    onChange={(event) =>
                      void handleStatusChange(
                        vehicle.id,
                        event.target.value as "available" | "maintenance" | "inactive"
                      )
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white disabled:opacity-50"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}