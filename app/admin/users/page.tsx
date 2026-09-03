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
    if (user?.role === "admin") load();
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
    <main className="min-h-screen bg-slate-950 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">Administration</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Users</h1>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950"
          >
            {showForm ? "Cancel" : "+ New user"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-700 bg-slate-900 p-5 sm:grid-cols-5"
          >
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            />
            <input
              required
              type="password"
              placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "staff" | "driver" })}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              <option value="staff">Staff</option>
              <option value="driver">Driver</option>
            </select>
            <button
              disabled={submitting}
              type="submit"
              className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
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
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
          <button
            onClick={load}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300"
          >
            Search
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-slate-400">admin</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as "staff" | "driver")}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                        >
                          <option value="staff">staff</option>
                          <option value="driver">driver</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          u.is_active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {u.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300"
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