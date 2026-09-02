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

const STATUS_OPTIONS = ["available", "assigned", "maintenance", "inactive"];

export default function AdminVehiclesPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, user, router, statusFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreating(true);

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
      setCreateSuccess("Vehicle added successfully.");
      await loadVehicles();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Could not create vehicle"
      );
    } finally {
      setCreating(false);
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
      setError(
        error instanceof Error ? error.message : "Could not update vehicle"
      );
    }
  }

  if (checkingSession || loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading vehicles...
      </main>
    );
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
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-8 grid gap-5 rounded-xl border border-slate-800 bg-slate-900 p-6 md:grid-cols-2"
        >
          <h2 className="text-lg font-semibold md:col-span-2">Add a vehicle</h2>

          <label className="block">
            <span className="text-sm text-slate-300">Registration number</span>
            <input
              required
              value={form.registrationNumber}
              onChange={(event) =>
                setForm({ ...form, registrationNumber: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Make</span>
            <input
              required
              value={form.make}
              onChange={(event) => setForm({ ...form, make: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Model</span>
            <input
              required
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">
              Manufacture year (optional)
            </span>
            <input
              type="number"
              min="1950"
              max={new Date().getFullYear()}
              value={form.manufactureYear}
              onChange={(event) =>
                setForm({ ...form, manufactureYear: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Capacity</span>
            <input
              required
              type="number"
              min="1"
              max="100"
              value={form.capacity}
              onChange={(event) =>
                setForm({ ...form, capacity: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <div className="md:col-span-2">
            {createError && (
              <p role="alert" className="mb-3 text-sm text-red-300">
                {createError}
              </p>
            )}
            {createSuccess && (
              <p className="mb-3 text-sm text-emerald-300">{createSuccess}</p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {creating ? "Adding..." : "Add vehicle"}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-red-400/10 p-4 text-red-300">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-4">
          {vehicles.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-6 text-slate-400">
              No vehicles match this filter.
            </p>
          )}

          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="mt-1 text-slate-300">
                    {vehicle.registration_number}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {vehicle.capacity} passenger capacity
                    {vehicle.manufacture_year
                      ? ` · ${vehicle.manufacture_year}`
                      : ""}
                  </p>
                </div>

                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs uppercase text-amber-300">
                  {vehicle.status}
                </span>
              </div>

              {vehicle.status !== "assigned" && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {STATUS_OPTIONS.filter(
                    (status) =>
                      status !== "assigned" && status !== vehicle.status
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        void handleStatusChange(
                          vehicle.id,
                          status as "available" | "maintenance" | "inactive"
                        )
                      }
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Mark {status}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}