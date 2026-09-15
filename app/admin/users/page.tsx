"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getAdminUsers,
  createAdminUser,
  updateUserStatus,
  updateUserRole,
  type AdminUser,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";

const EMPTY_FORM = { name: "", email: "", password: "", role: "staff" as "staff" | "driver" };

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

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!checkingSession && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [checkingSession, user, router]);

  function load() {
    setLoading(true);
    setError("");
    getAdminUsers({ role: roleFilter || undefined, search: search || undefined })
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === "admin") {
      // This effect intentionally loads users when the role filter changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roleFilter]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createAdminUser(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(targetUser: AdminUser) {
    try {
      await updateUserStatus(targetUser.id, !targetUser.is_active);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleRoleChange(targetUser: AdminUser, newRole: "staff" | "driver") {
    try {
      await updateUserRole(targetUser.id, newRole);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  if (checkingSession || !user || user.role !== "admin") {
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">Users</h1>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="osu-btn osu-btn-primary">
            {showForm ? "Cancel" : "+ New user"}
          </button>
        </div>

        {error && (
          <p role="alert" className="osu-alert-error mt-4 text-sm">
            {error}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="osu-card mt-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-5">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="osu-input"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="osu-input"
            />
            <input
              required
              type="password"
              placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="osu-input"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "staff" | "driver" })}
              className="osu-input"
            >
              <option value="staff">Staff</option>
              <option value="driver">Driver</option>
            </select>
            <button disabled={submitting} type="submit" className="osu-btn osu-btn-primary">
              {submitting ? "Creating…" : "Create"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="osu-input w-auto text-sm"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="driver">Driver</option>
          </select>
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="osu-input flex-1 text-sm"
          />
          <button onClick={load} className="osu-btn osu-btn-outline text-sm">
            Search
          </button>
        </div>

        <div className="osu-card mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-100)] text-xs uppercase text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-[var(--color-border)] bg-[var(--color-surface-0)] transition-colors hover:bg-[var(--color-surface-50)]"
                  >
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-[var(--color-text-muted)]">admin</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as "staff" | "driver")}
                          className="osu-input w-auto py-1 text-xs"
                        >
                          <option value="staff">staff</option>
                          <option value="driver">driver</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-1 text-xs"
                        style={
                          u.is_active
                            ? { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }
                            : { backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }
                        }
                      >
                        {u.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-400)] hover:text-[var(--color-text-primary)]"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
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