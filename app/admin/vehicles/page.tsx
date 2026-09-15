"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmVehicleReceipt,
  createFuelRecord,
  createMaintenanceRecord,
  createVehicle,
  getVehicleFuelRecords,
  getVehicles,
  updateVehicleStatus,
  type FuelRecord,
  type Vehicle,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

// Vehicle status -> semantic token mapping, same pattern used for trip
// statuses elsewhere in the app.
const VEHICLE_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  available: { bg: "var(--color-success-bg)", text: "var(--color-success)" },
  assigned: { bg: "var(--color-primary-100)", text: "var(--color-primary-700)" },
  maintenance: { bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  inactive: { bg: "var(--color-surface-100)", text: "var(--color-text-secondary)" },
};
const DEFAULT_VEHICLE_STATUS_STYLE = {
  bg: "var(--color-surface-100)",
  text: "var(--color-text-secondary)",
};

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
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<string | null>(
    null
  );
  const [fuelVehicleId, setFuelVehicleId] = useState<string | null>(null);
  const [fuelRecords, setFuelRecords] = useState<Record<string, FuelRecord[]>>(
    {}
  );
  const [fuelForm, setFuelForm] = useState({
    fueledAt: "",
    liters: "",
    cost: "",
    odometerKm: "",
    fuelType: "diesel" as FuelRecord["fuel_type"],
    stationName: "",
    notes: "",
  });
  const [savingFuel, setSavingFuel] = useState(false);
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<
    string | null
  >(null);

  const [savingMaintenance, setSavingMaintenance] = useState(false);

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: "inspection" as
      | "inspection"
      | "service"
      | "repair"
      | "accident",
    description: "",
    performedAt: new Date().toISOString().slice(0, 16),
    mileage: "",
    cost: "",
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

  const canAccessVehicles =
    user?.role === "admin" ||
    user?.role === "fleet_officer" ||
    user?.role === "transport_unit";

  useEffect(() => {
    if (checkingSession) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccessVehicles) {
      router.replace("/dashboard");
      return;
    }

    // The effect intentionally loads vehicles after authentication and when the filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, user, canAccessVehicles, router, statusFilter]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!canAccessVehicles) {
    return null;
  }

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

  async function handleSaveMaintenance(vehicleId: string) {
    if (
      !maintenanceForm.description.trim() ||
      !maintenanceForm.performedAt ||
      !maintenanceForm.cost
    ) {
      setError("Maintenance reason, date, and cost are required.");
      return;
    }

    try {
      setSavingMaintenance(true);
      setError("");
      setSuccess("");

      await createMaintenanceRecord(vehicleId, {
        maintenanceType: maintenanceForm.maintenanceType,
        description: maintenanceForm.description.trim(),
        performedAt: new Date(
          maintenanceForm.performedAt
        ).toISOString(),
        mileage: maintenanceForm.mileage
          ? Number(maintenanceForm.mileage)
          : undefined,
        cost: Number(maintenanceForm.cost),
      });

      setMaintenanceVehicleId(null);
      setMaintenanceForm({
        maintenanceType: "inspection",
        description: "",
        performedAt: new Date().toISOString().slice(0, 16),
        mileage: "",
        cost: "",
      });

      setSuccess("Maintenance record saved and vehicle placed under maintenance.");
      await loadVehicles();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save maintenance record"
      );
    } finally {
      setSavingMaintenance(false);
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

  async function handleOpenFuel(vehicleId: string) {
    try {
      setError("");
      const records = await getVehicleFuelRecords(vehicleId);

      setFuelRecords((current) => ({
        ...current,
        [vehicleId]: records,
      }));

      setFuelVehicleId(vehicleId);

      setFuelForm({
        fueledAt: new Date().toISOString().slice(0, 16),
        liters: "",
        cost: "",
        odometerKm: "",
        fuelType: "diesel",
        stationName: "",
        notes: "",
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load fuel records"
      );
    }
  }

  async function handleSaveFuel(vehicleId: string) {
    if (!fuelForm.fueledAt || !fuelForm.liters || !fuelForm.cost) {
      setError("Date, liters, and cost are required.");
      return;
    }

    try {
      setSavingFuel(true);
      setError("");
      setSuccess("");

      const record = await createFuelRecord(vehicleId, {
        fueledAt: new Date(fuelForm.fueledAt).toISOString(),
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        odometerKm: fuelForm.odometerKm
          ? Number(fuelForm.odometerKm)
          : undefined,
        fuelType: fuelForm.fuelType,
        stationName: fuelForm.stationName || undefined,
        notes: fuelForm.notes || undefined,
      });

      setFuelRecords((current) => ({
        ...current,
        [vehicleId]: [record, ...(current[vehicleId] ?? [])],
      }));

      setFuelForm({
        fueledAt: "",
        liters: "",
        cost: "",
        odometerKm: "",
        fuelType: "diesel",
        stationName: "",
        notes: "",
      });

      setSuccess("Fuel record saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save fuel record"
      );
    } finally {
      setSavingFuel(false);
    }
  }

  async function handleConfirmReceipt(vehicleId: string) {
    try {
      setError("");
      setSuccess("");
      setConfirmingReceiptId(vehicleId);

      await confirmVehicleReceipt(vehicleId);

      setSuccess("Vehicle receipt confirmed successfully.");
      await loadVehicles();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not confirm vehicle receipt"
      );
    } finally {
      setConfirmingReceiptId(null);
    }
  }

  if (checkingSession || loading) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-50)] p-8 text-[var(--color-text-muted)]">
        Loading vehicles...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] p-6 text-[var(--color-text-primary)] sm:p-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(27,87,64,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)]"
        >
          ← Back to dashboard
        </button>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
              Administrator workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Vehicle management</h1>
          </div>

          <label className="text-sm text-[var(--color-text-secondary)]">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="osu-input ml-3 inline-block w-auto"
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
          <p role="alert" className="osu-alert-error mt-5">
            {error}
          </p>
        )}
        {success && <p className="osu-alert-success mt-5">{success}</p>}

        {user.role === "admin" && (
          <form onSubmit={handleCreate} className="osu-card mt-8 grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-5">
            <input
              required
              placeholder="Registration"
              value={form.registrationNumber}
              onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })}
              className="osu-input"
            />
            <input
              required
              placeholder="Make"
              value={form.make}
              onChange={(event) => setForm({ ...form, make: event.target.value })}
              className="osu-input"
            />
            <input
              required
              placeholder="Model"
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              className="osu-input"
            />
            <input
              type="number"
              placeholder="Year"
              value={form.manufactureYear}
              onChange={(event) => setForm({ ...form, manufactureYear: event.target.value })}
              className="osu-input"
            />
            <input
              required
              min="1"
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              className="osu-input"
            />
            <button
              type="submit"
              disabled={submitting}
              className="osu-btn osu-btn-primary md:col-span-2 lg:col-span-5"
            >
              {submitting ? "Creating..." : "Add vehicle"}
            </button>
          </form>
        )}

        <section className="mt-8 space-y-4">
          {vehicles.length === 0 && (
            <p className="osu-card p-6 text-[var(--color-text-muted)]">
              No vehicles match this filter.
            </p>
          )}

          {vehicles.map((vehicle) => {
            const statusStyle = VEHICLE_STATUS_STYLE[vehicle.status] ?? DEFAULT_VEHICLE_STATUS_STYLE;
            return (
              <article key={vehicle.id} className="osu-card osu-card-hover p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {vehicle.registration_number}
                    </h2>
                    <p className="mt-1 text-[var(--color-text-secondary)]">
                      {vehicle.make} {vehicle.model} · Capacity {vehicle.capacity}
                    </p>
                    {vehicle.manufacture_year && (
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Year: {vehicle.manufacture_year}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(user.role === "admin" || user.role === "transport_unit") &&
                      vehicle.status === "available" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMaintenanceVehicleId(vehicle.id);
                            setMaintenanceForm({
                              maintenanceType: "inspection",
                              description: "",
                              performedAt: new Date().toISOString().slice(0, 16),
                              mileage: "",
                              cost: "",
                            });
                            setError("");
                            setSuccess("");
                          }}
                          className="rounded-lg border border-[var(--color-warning)]/50 px-3 py-2 text-sm text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning-bg)]"
                        >
                          Start maintenance
                        </button>
                      )}

                    {(user.role === "admin" || user.role === "transport_unit") && (
                      <button
                        type="button"
                        onClick={() => void handleOpenFuel(vehicle.id)}
                        className="rounded-lg border border-[var(--color-primary-400)]/60 px-3 py-2 text-sm text-[var(--color-primary-700)] transition-colors hover:bg-[var(--color-primary-100)]"
                      >
                        Fuel records
                      </button>
                    )}

                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {vehicle.status}
                    </span>

                    {vehicle.status === "assigned" && vehicle.awaiting_receipt && (
                      <button
                        type="button"
                        disabled={confirmingReceiptId === vehicle.id}
                        onClick={() => void handleConfirmReceipt(vehicle.id)}
                        className="rounded-lg bg-[var(--color-warning)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {confirmingReceiptId === vehicle.id
                          ? "Confirming..."
                          : "Confirm receipt"}
                      </button>
                    )}

                    <select
                      value={vehicle.status}
                      disabled={vehicle.status === "assigned"}
                      onChange={(event) =>
                        void handleStatusChange(
                          vehicle.id,
                          event.target.value as "available" | "inactive"
                        )
                      }
                      className="osu-input w-auto py-2 text-sm disabled:opacity-50"
                    >
                      <option value="available">Available</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {(user.role === "admin" || user.role === "transport_unit") &&
                  maintenanceVehicleId === vehicle.id && (
                    <div className="mt-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-surface-50)] p-4">
                      <h3 className="font-semibold text-[var(--color-warning)]">
                        Create maintenance record
                      </h3>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <select
                          value={maintenanceForm.maintenanceType}
                          onChange={(event) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              maintenanceType: event.target.value as
                                | "inspection"
                                | "service"
                                | "repair"
                                | "accident",
                            })
                          }
                          className="osu-input"
                        >
                          <option value="inspection">Inspection</option>
                          <option value="service">Service</option>
                          <option value="repair">Repair</option>
                          <option value="accident">Accident</option>
                        </select>

                        <input
                          type="datetime-local"
                          value={maintenanceForm.performedAt}
                          onChange={(event) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              performedAt: event.target.value,
                            })
                          }
                          className="osu-input"
                        />

                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost"
                          value={maintenanceForm.cost}
                          onChange={(event) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              cost: event.target.value,
                            })
                          }
                          className="osu-input"
                        />

                        <input
                          type="number"
                          min="0"
                          placeholder="Mileage km (optional)"
                          value={maintenanceForm.mileage}
                          onChange={(event) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              mileage: event.target.value,
                            })
                          }
                          className="osu-input"
                        />

                        <textarea
                          required
                          rows={3}
                          placeholder="Reason or maintenance description"
                          value={maintenanceForm.description}
                          onChange={(event) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              description: event.target.value,
                            })
                          }
                          className="osu-input md:col-span-2 lg:col-span-4"
                        />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          disabled={
                            savingMaintenance ||
                            !maintenanceForm.description.trim() ||
                            !maintenanceForm.cost
                          }
                          onClick={() => void handleSaveMaintenance(vehicle.id)}
                          className="rounded-lg bg-[var(--color-warning)] px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {savingMaintenance
                            ? "Saving..."
                            : "Save maintenance record"}
                        </button>

                        <button
                          type="button"
                          disabled={savingMaintenance}
                          onClick={() => setMaintenanceVehicleId(null)}
                          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                {(user.role === "admin" || user.role === "transport_unit") &&
                  fuelVehicleId === vehicle.id && (
                    <div className="mt-5 rounded-lg border border-[var(--color-primary-200)] bg-[var(--color-surface-50)] p-4">
                      <h3 className="font-semibold text-[var(--color-primary-700)]">
                        Record fuel usage
                      </h3>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <input
                          type="datetime-local"
                          value={fuelForm.fueledAt}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, fueledAt: event.target.value })
                          }
                          className="osu-input"
                        />

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Liters"
                          value={fuelForm.liters}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, liters: event.target.value })
                          }
                          className="osu-input"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost"
                          value={fuelForm.cost}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, cost: event.target.value })
                          }
                          className="osu-input"
                        />

                        <input
                          type="number"
                          min="0"
                          placeholder="Odometer km"
                          value={fuelForm.odometerKm}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, odometerKm: event.target.value })
                          }
                          className="osu-input"
                        />

                        <select
                          value={fuelForm.fuelType}
                          onChange={(event) =>
                            setFuelForm({
                              ...fuelForm,
                              fuelType: event.target.value as FuelRecord["fuel_type"],
                            })
                          }
                          className="osu-input"
                        >
                          <option value="diesel">Diesel</option>
                          <option value="petrol">Petrol</option>
                          <option value="electric">Electric</option>
                          <option value="other">Other</option>
                        </select>

                        <input
                          placeholder="Station name"
                          value={fuelForm.stationName}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, stationName: event.target.value })
                          }
                          className="osu-input"
                        />

                        <input
                          placeholder="Notes"
                          value={fuelForm.notes}
                          onChange={(event) =>
                            setFuelForm({ ...fuelForm, notes: event.target.value })
                          }
                          className="osu-input md:col-span-2"
                        />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          disabled={savingFuel}
                          onClick={() => void handleSaveFuel(vehicle.id)}
                          className="osu-btn osu-btn-primary"
                        >
                          {savingFuel ? "Saving..." : "Save fuel record"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFuelVehicleId(null)}
                          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-5 space-y-2">
                        {(fuelRecords[vehicle.id] ?? []).map((record) => (
                          <div
                            key={record.id}
                            className="rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-secondary)]"
                          >
                            <p>
                              {record.liters} L · {record.fuel_type} · Cost: {record.cost}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {new Date(record.fueled_at).toLocaleString()}
                              {record.station_name ? ` · ${record.station_name}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
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