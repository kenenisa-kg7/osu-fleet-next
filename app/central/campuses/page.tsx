"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  createCampus,
  getAllCampuses,
  updateCampus,
  updateCampusStatus,
  type Campus,
  type CampusInput,
} from "../../../lib/api";

const emptyForm: CampusInput = {
  name: "",
  code: "OSU-",
  city: "",
};

export default function CentralCampusesPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [form, setForm] = useState<CampusInput>(emptyForm);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const canManage = user?.role === "super_admin";

  async function loadCampuses() {
    setLoading(true);
    setError("");

    try {
      const data = canManage
        ? await getAllCampuses()
        : await import("../../../lib/api").then(({ getCampuses }) =>
            getCampuses()
          );

      setCampuses(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load campuses"
      );
    } finally {
      setLoading(false);
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

    // This effect intentionally loads campuses when central access is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCampuses();
  }, [canAccess, canManage]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateForm(field: keyof CampusInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(campus: Campus) {
    setEditingCampusId(campus.id);
    setForm({
      name: campus.name,
      code: campus.code,
      city: campus.city,
    });
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingCampusId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingCampusId) {
        await updateCampus(editingCampusId, form);
        setMessage("Campus updated successfully.");
      } else {
        await createCampus(form);
        setMessage("Campus created successfully.");
      }

      cancelEditing();
      await loadCampuses();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not save campus"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(campus: Campus) {
    const nextStatus = !campus.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${campus.name}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateCampusStatus(campus.id, nextStatus);
      setMessage(
        nextStatus
          ? "Campus activated successfully."
          : "Campus deactivated successfully."
      );
      await loadCampuses();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update campus status"
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Checking your session...
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-center text-sm text-[var(--color-danger)]">
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
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
              Oromia State University
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Campus administration
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
              {canManage
                ? "Manage all OSU campuses and their operational status."
                : "View active OSU campuses across the university fleet network."}
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

        {canManage && (
          <form
            onSubmit={handleSubmit}
            className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-4"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">
                Campus name
              </span>
              <input
                required
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Enter campus name"
                className="osu-input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">
                Campus code
              </span>
              <input
                required
                value={form.code}
                onChange={(event) =>
                  updateForm("code", event.target.value.toUpperCase())
                }
                placeholder="OSU-CODE"
                className="osu-input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">
                City
              </span>
              <input
                required
                value={form.city}
                onChange={(event) => updateForm("city", event.target.value)}
                placeholder="Enter city"
                className="osu-input"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="osu-btn osu-btn-primary min-h-[42px] flex-1"
              >
                {saving
                  ? "Saving..."
                  : editingCampusId
                    ? "Save changes"
                    : "Create campus"}
              </button>

              {editingCampusId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="osu-btn osu-btn-outline min-h-[42px]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {message && (
          <p
            role="status"
            className="osu-alert-success mt-6 text-sm"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="osu-alert-error mt-6 text-sm"
          >
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]"
              aria-hidden="true"
            />
            Loading campuses...
          </div>
        )}

        {!loading && (
          <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campuses.map((campus) => (
              <article
                key={campus.id}
                className="osu-card osu-card-hover p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                      Campus
                    </p>
                    <h2 className="mt-1 font-semibold text-[var(--color-text-primary)]">
                      {campus.name}
                    </h2>
                  </div>

                  <span
                    className={
                      campus.is_active
                        ? "osu-badge osu-badge-success"
                        : "osu-badge osu-badge-danger"
                    }
                  >
                    {campus.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      City:
                    </span>{" "}
                    {campus.city}
                  </p>

                  <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)]">
                    {campus.code}
                  </p>
                </div>

                {canManage && (
                  <div className="mt-5 flex gap-2 border-t border-[var(--color-border)] pt-4">
                    <button
                      type="button"
                      onClick={() => startEditing(campus)}
                      className="osu-btn osu-btn-ghost-primary px-3 py-2 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleStatusChange(campus)}
                      className={
                        campus.is_active
                          ? "osu-btn osu-btn-outline px-3 py-2 text-xs text-[var(--color-danger)] hover:border-[var(--color-danger)]"
                          : "osu-btn osu-btn-outline px-3 py-2 text-xs text-[var(--color-success)] hover:border-[var(--color-success)]"
                      }
                    >
                      {campus.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </article>
            ))}

            {campuses.length === 0 && (
              <div className="osu-card col-span-full p-10 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No campuses found.
                </p>

                {canManage && (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Create the first campus using the form above.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
