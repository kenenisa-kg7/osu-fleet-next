"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDriver,
  getDrivers,
  updateDriverStatus,
  type Driver,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
};

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

export default function AdminDriversPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canAccess =
    user?.role === "admin" || user?.role === "fleet_officer";

  async function loadDrivers() {
    try {
      setLoading(true);
      setError("");
      const result = await getDrivers(search);
      setDrivers(result.drivers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load drivers");
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

    if (!canAccess) {
      router.replace("/dashboard");
      return;
    }

    void loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, user, canAccess]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await createDriver(form);

      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess("Driver created successfully.");
      await loadDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create driver");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(driver: Driver) {
    try {
      setError("");
      setSuccess("");

      await updateDriverStatus(driver.id, !driver.is_active);

      setSuccess(
        driver.is_active
          ? "Driver deactivated."
          : "Driver activated."
      );

      await loadDrivers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update driver status"
      );
    }
  }

  if (checkingSession || !user || !canAccess) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] px-6 py-10 text-[var(--color-text-primary)] sm:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(27,87,64,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        <BackLink onClick={() => router.push("/dashboard")} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
              Fleet Officer workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">Drivers</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="osu-btn osu-btn-primary"
          >
            {showForm ? "Cancel" : "+ New driver"}
          </button>
        </div>

        {error && (
          <p role="alert" className="osu-alert-error mt-5">
            {error}
          </p>
        )}

        {success && (
          <p className="osu-alert-success mt-5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {success}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="osu-card mt-6 grid gap-3 p-5 md:grid-cols-4">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="osu-input"
            />

            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="osu-input"
            />

            <input
              required
              minLength={8}
              type="password"
              placeholder="Password, minimum 8 characters"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="osu-input"
            />

            <button disabled={submitting} type="submit" className="osu-btn osu-btn-primary">
              {submitting ? "Creating..." : "Create driver"}
            </button>
          </form>
        )}

        <div className="mt-6 flex gap-3">
          <input
            placeholder="Search drivers by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadDrivers();
              }
            }}
            className="osu-input flex-1"
          />

          <button
            type="button"
            onClick={() => void loadDrivers()}
            className="osu-btn osu-btn-outline"
          >
            Search
          </button>
        </div>

        <div className="osu-card mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-100)] text-xs uppercase text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    Loading drivers...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="border-t border-[var(--color-border)] bg-[var(--color-surface-0)] transition-colors hover:bg-[var(--color-surface-50)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{driver.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {driver.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          driver.is_active
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-danger)]"
                        }
                      >
                        {driver.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(driver)}
                        className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-400)] hover:text-[var(--color-text-primary)]"
                      >
                        {driver.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}