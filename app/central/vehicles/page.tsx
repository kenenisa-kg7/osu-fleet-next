"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  createCentralVehicle,
  getCentralVehicles,
  getCampuses,
  updateVehicleCampus,
  type Campus,
  type CentralVehicle,
  type CentralVehiclePage,
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

export default function CentralVehiclesPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [result, setResult] = useState<CentralVehiclePage | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingVehicleId, setUpdatingVehicleId] = useState<string | null>(
    null
  );

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [capacity, setCapacity] = useState("");
  const [newVehicleCampusId, setNewVehicleCampusId] = useState("");
  const [creatingVehicle, setCreatingVehicle] = useState(false);

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const canManageCampus = user?.role === "super_admin";

  async function loadVehicles() {
    setLoading(true);
    setError("");

    try {
      const data = await getCentralVehicles({
        campusId,
        status,
        search,
      });

      setResult(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load vehicle report"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAccess) {
      setError("You do not have permission to register vehicles.");
      return;
    }

    if (!newVehicleCampusId) {
      setError("Please select a destination campus.");
      setActionMessage("");
      return;
    }

    setCreatingVehicle(true);
    setError("");
    setActionMessage("");

    try {
      await createCentralVehicle({
        registrationNumber: registrationNumber.trim(),
        make: make.trim(),
        model: model.trim(),
        manufactureYear: manufactureYear
          ? Number(manufactureYear)
          : undefined,
        capacity: Number(capacity),
        campusId: newVehicleCampusId,
      });

      setRegistrationNumber("");
      setMake("");
      setModel("");
      setManufactureYear("");
      setCapacity("");
      setNewVehicleCampusId("");

      setActionMessage(
        "Vehicle registered and assigned successfully."
      );

      await loadVehicles();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not register vehicle"
      );
    } finally {
      setCreatingVehicle(false);
    }
  }

  function handleExportVehicles() {
    if (!result || result.vehicles.length === 0) {
      setError("There are no vehicles to export.");
      return;
    }

    downloadCsv(
      `osu-central-vehicles-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      [
        "Vehicle ID",
        "Registration Number",
        "Make",
        "Model",
        "Manufacture Year",
        "Campus",
        "Campus Code",
        "City",
        "Status",
        "Capacity",
        "Total Trips",
        "Completed Trips",
        "Active Trips",
      ],
      result.vehicles.map((vehicle) => [
        vehicle.id,
        vehicle.registration_number,
        vehicle.make,
        vehicle.model,
        vehicle.manufacture_year ?? "",
        vehicle.campus_name,
        vehicle.campus_code,
        vehicle.campus_city,
        vehicle.status,
        vehicle.capacity,
        vehicle.total_trips,
        vehicle.completed_trips,
        vehicle.active_trips,
      ])
    );
  }

  async function handleCampusChange(
    vehicleId: string,
    nextCampusId: string,
    reason: string,
    notes: string
  ) {
    if (!nextCampusId || !reason.trim()) {
      return;
    }

    setUpdatingVehicleId(vehicleId);
    setActionMessage("");
    setError("");

    try {
      await updateVehicleCampus(
        vehicleId,
        nextCampusId,
        reason.trim(),
        notes.trim()
      );

      setActionMessage("Vehicle campus transferred successfully.");
      await loadVehicles();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not transfer vehicle"
      );
    } finally {
      setUpdatingVehicleId(null);
    }
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

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    // This effect intentionally loads vehicles when central access is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicles();

    // Filters are submitted through the form.
  }, [canAccess]); // eslint-disable-line react-hooks/exhaustive-deps

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
              Central vehicle report
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View and manage vehicles across all OSU campuses.
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
          onSubmit={handleCreateVehicle}
          className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <div className="md:col-span-2 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
              Fleet registration
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              Register new vehicle
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Register the vehicle centrally and assign it to an active
              campus.
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Registration number</span>
            <input
              required
              value={registrationNumber}
              onChange={(event) =>
                setRegistrationNumber(event.target.value)
              }
              placeholder="e.g. OSU-1234"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Make</span>
            <input
              required
              value={make}
              onChange={(event) => setMake(event.target.value)}
              placeholder="Vehicle make"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Model</span>
            <input
              required
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="Vehicle model"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Manufacture year</span>
            <input
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              value={manufactureYear}
              onChange={(event) =>
                setManufactureYear(event.target.value)
              }
              placeholder="Year"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Passenger capacity</span>
            <input
              required
              type="number"
              min={1}
              max={100}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Capacity"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Destination campus</span>
            <select
              required
              value={newVehicleCampusId}
              onChange={(event) =>
                setNewVehicleCampusId(event.target.value)
              }
              className="osu-input"
            >
              <option value="">Select destination campus</option>

              {campuses
                .filter((campus) => campus.is_active)
                .map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name} — {campus.city}
                  </option>
                ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingVehicle}
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              {creatingVehicle ? "Registering..." : "Register vehicle"}
            </button>
          </div>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadVehicles();
          }}
          className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-4"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Search vehicles</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Registration, make, or model"
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Campus</span>
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
            <span className="font-medium">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="osu-input"
            >
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              Filter vehicles
            </button>
          </div>
        </form>

        {actionMessage && (
          <p role="status" className="osu-alert-success mt-6 text-sm">
            {actionMessage}
          </p>
        )}

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
            Loading vehicle report...
          </div>
        )}

        {result && !loading && (
          <section className="osu-card mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                  Fleet inventory
                </p>

                <h2 className="mt-1 font-semibold">
                  Vehicles
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {result.pagination.total} total vehicles
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportVehicles}
                disabled={result.vehicles.length === 0}
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
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-5 py-4">Vehicle</th>
                    <th className="px-5 py-4">Campus</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Capacity</th>
                    <th className="px-5 py-4">Total trips</th>
                    <th className="px-5 py-4">Completed</th>
                    <th className="px-5 py-4">Active</th>
                    <th className="px-5 py-4">History</th>
                    {canManageCampus && (
                      <th className="px-5 py-4">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {result.vehicles.map((vehicle) => (
                    <VehicleRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      campuses={campuses}
                      canManageCampus={canManageCampus}
                      updating={updatingVehicleId === vehicle.id}
                      onCampusChange={handleCampusChange}
                      onViewHistory={(vehicleId) =>
                        router.push(
                          `/central/vehicles/${vehicleId}/assignments`
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {result.vehicles.length === 0 && (
              <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
                No vehicles found.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function VehicleRow({
  vehicle,
  campuses,
  canManageCampus,
  updating,
  onCampusChange,
  onViewHistory,
}: {
  vehicle: CentralVehicle;
  campuses: Campus[];
  canManageCampus: boolean;
  updating: boolean;
  onCampusChange: (
    vehicleId: string,
    campusId: string,
    reason: string,
    notes: string
  ) => void;
  onViewHistory: (vehicleId: string) => void;
}) {
  const [selectedCampusId, setSelectedCampusId] = useState(
    vehicle.campus_id
  );
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0">
      <td className="px-5 py-4">
        <p className="font-medium text-[var(--color-text-primary)]">
          {vehicle.registration_number}
        </p>

        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {vehicle.make} {vehicle.model}
          {vehicle.manufacture_year
            ? ` · ${vehicle.manufacture_year}`
            : ""}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-[var(--color-text-primary)]">
          {vehicle.campus_name}
        </p>

        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {vehicle.campus_code} · {vehicle.campus_city}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="osu-badge osu-badge-success">
          {vehicle.status}
        </span>
      </td>

      <td className="px-5 py-4 text-[var(--color-text-secondary)]">
        {vehicle.capacity}
      </td>

      <td className="px-5 py-4">
        {vehicle.total_trips}
      </td>

      <td className="px-5 py-4">
        {vehicle.completed_trips}
      </td>

      <td className="px-5 py-4">
        {vehicle.active_trips}
      </td>

      <td className="px-5 py-4">
        {vehicle.transport_count > 0 ? (
          <button
            type="button"
            onClick={() => onViewHistory(vehicle.id)}
            className="osu-btn osu-btn-ghost-primary px-3 py-2 text-xs"
          >
            View history
          </button>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">
            No history
          </span>
        )}
      </td>

      {canManageCampus && (
        <td className="px-5 py-4">
          <div className="min-w-[220px] space-y-2">
            <select
              value={selectedCampusId}
              disabled={updating}
              onChange={(event) => {
                setSelectedCampusId(event.target.value);
                setTransferReason("");
                setTransferNotes("");
              }}
              className="osu-input text-xs disabled:opacity-50"
            >
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>

            {selectedCampusId !== vehicle.campus_id && (
              <>
                <input
                  value={transferReason}
                  onChange={(event) =>
                    setTransferReason(event.target.value)
                  }
                  placeholder="Transfer reason"
                  maxLength={200}
                  disabled={updating}
                  className="osu-input text-xs disabled:opacity-50"
                />

                <textarea
                  value={transferNotes}
                  onChange={(event) =>
                    setTransferNotes(event.target.value)
                  }
                  placeholder="Notes (optional)"
                  maxLength={2000}
                  rows={2}
                  disabled={updating}
                  className="osu-input resize-none text-xs disabled:opacity-50"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      updating || transferReason.trim().length < 3
                    }
                    onClick={() => {
                      onCampusChange(
                        vehicle.id,
                        selectedCampusId,
                        transferReason,
                        transferNotes
                      );
                    }}
                    className="osu-btn osu-btn-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating ? "Transferring..." : "Confirm transfer"}
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      setSelectedCampusId(vehicle.campus_id);
                      setTransferReason("");
                      setTransferNotes("");
                    }}
                    className="osu-btn osu-btn-outline px-3 py-2 text-xs disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
