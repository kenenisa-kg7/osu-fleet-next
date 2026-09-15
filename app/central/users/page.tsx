"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  createCentralUser,
  getCentralUsers,
  getCampuses,
  resetCentralUserPassword,
  updateUserCampus,
  type Campus,
  type CentralUser,
  type CentralUserPage,
} from "../../../lib/api";

const centralRoles = new Set([
  "super_admin",
  "central_fleet_manager",
]);

export default function CentralUsersPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [result, setResult] = useState<CentralUserPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("staff");
  const [createCampusId, setCreateCampusId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const canManageCampus = user?.role === "super_admin";

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await getCentralUsers({
        campusId,
        role,
        search,
      });

      setResult(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load central users"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCampusChange(
    userId: string,
    nextCampusId: string
  ) {
    if (!nextCampusId) {
      return;
    }

    setUpdatingUserId(userId);
    setActionMessage("");
    setError("");

    try {
      await updateUserCampus(userId, nextCampusId);
      setActionMessage("User campus updated successfully.");
      await loadUsers();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update user campus"
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handlePasswordReset(userId: string) {
    const newPassword = window.prompt(
      "Enter a new temporary password. It must contain at least 8 characters:"
    );

    if (newPassword === null) {
      return;
    }

    if (newPassword.length < 8) {
      setError("The new password must contain at least 8 characters.");
      setActionMessage("");
      return;
    }

    setResettingUserId(userId);
    setError("");
    setActionMessage("");

    try {
      await resetCentralUserPassword(userId, newPassword);
      setActionMessage("Password reset successfully.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not reset password"
      );
    } finally {
      setResettingUserId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const centralRole =
      createRole === "super_admin" ||
      createRole === "central_fleet_manager";

    if (!centralRole && !createCampusId) {
      setError("Please select a campus for this user.");
      setActionMessage("");
      return;
    }

    setCreatingUser(true);
    setError("");
    setActionMessage("");

    try {
      await createCentralUser({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        password: createPassword,
        role: createRole as
          | "admin"
          | "staff"
          | "driver"
          | "fleet_officer"
          | "transport_unit"
          | "requester"
          | "viewer"
          | "super_admin"
          | "central_fleet_manager",
        campusId: centralRole ? null : createCampusId,
      });

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("staff");
      setCreateCampusId("");
      setActionMessage("User created successfully.");

      await loadUsers();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create user"
      );
    } finally {
      setCreatingUser(false);
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

    // This effect intentionally loads users when central access is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();

    // Filtering is submitted through the form.
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
              Central user directory
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View and manage users across all OSU campuses.
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

        {canManageCampus && (
          <form
            onSubmit={handleCreateUser}
            autoComplete="off"
            className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                User management
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Create user
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Campus roles require a campus. Central roles do not use a
                campus.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Full name</span>
              <input
                required
                name="new-user-name"
                autoComplete="off"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Enter full name"
                className="osu-input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Email address</span>
              <input
                required
                type="email"
                name="new-user-email"
                autoComplete="new-user"
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                placeholder="name@osu.edu.et"
                className="osu-input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Temporary password</span>
              <input
                required
                type="password"
                name="new-user-password"
                autoComplete="new-password"
                minLength={8}
                value={createPassword}
                onChange={(event) =>
                  setCreatePassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                className="osu-input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Role</span>
              <select
                value={createRole}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setCreateRole(nextRole);

                  if (
                    nextRole === "super_admin" ||
                    nextRole === "central_fleet_manager"
                  ) {
                    setCreateCampusId("");
                  }
                }}
                className="osu-input"
              >
                <option value="admin">Campus admin</option>
                <option value="staff">Staff</option>
                <option value="driver">Driver</option>
                <option value="fleet_officer">Fleet officer</option>
                <option value="transport_unit">Transport unit</option>
                <option value="requester">Requester</option>
                <option value="viewer">Viewer</option>
                <option value="central_fleet_manager">
                  Central fleet manager
                </option>
                <option value="super_admin">Super admin</option>
              </select>
            </label>

            {createRole !== "super_admin" &&
              createRole !== "central_fleet_manager" && (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Campus</span>
                  <select
                    required
                    value={createCampusId}
                    onChange={(event) =>
                      setCreateCampusId(event.target.value)
                    }
                    className="osu-input"
                  >
                    <option value="">Select campus</option>

                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} — {campus.city}
                      </option>
                    ))}
                  </select>
                </label>
              )}

            {(createRole === "super_admin" ||
              createRole === "central_fleet_manager") && (
              <div className="flex items-center rounded-xl border border-[var(--color-secondary-200)] bg-[var(--color-secondary-50)] px-3 py-2 text-sm text-[var(--color-secondary-700)]">
                Central user — no campus assignment
              </div>
            )}

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingUser}
                className="osu-btn osu-btn-primary min-h-[42px] w-full disabled:opacity-50"
              >
                {creatingUser ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers();
          }}
          className="osu-card mt-8 grid gap-4 p-5 sm:p-6 md:grid-cols-4"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Search users</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
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
            <span className="font-medium">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="osu-input"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="driver">Driver</option>
              <option value="fleet_officer">Fleet officer</option>
              <option value="requester">Requester</option>
              <option value="viewer">Viewer</option>
              <option value="central_fleet_manager">
                Central fleet manager
              </option>
              <option value="super_admin">Super admin</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              Filter users
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
            Loading users...
          </div>
        )}

        {result && !loading && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Total users"
                value={result.pagination.total}
              />

              <SummaryCard
                label="Displayed"
                value={result.users.length}
              />

              <SummaryCard
                label="Central users"
                value={
                  result.users.filter((item) =>
                    centralRoles.has(item.role)
                  ).length
                }
              />
            </div>

            <section className="osu-card mt-8 overflow-hidden">
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                  Directory
                </p>

                <h2 className="mt-1 font-semibold">
                  Registered users
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Campus</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Created</th>
                      {canManageCampus && (
                        <th className="px-5 py-4">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {result.users.map((item) => (
                      <UserRow
                        key={item.id}
                        user={item}
                        campuses={campuses}
                        canManageCampus={canManageCampus}
                        resetting={resettingUserId === item.id}
                        updating={updatingUserId === item.id}
                        onCampusChange={handleCampusChange}
                        onPasswordReset={handlePasswordReset}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {result.users.length === 0 && (
                <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  No users found.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function UserRow({
  user,
  campuses,
  canManageCampus,
  updating,
  resetting,
  onCampusChange,
  onPasswordReset,
}: {
  user: CentralUser;
  campuses: Campus[];
  canManageCampus: boolean;
  updating: boolean;
  resetting: boolean;
  onCampusChange: (userId: string, campusId: string) => void;
  onPasswordReset: (userId: string) => void;
}) {
  const isCentralRole =
    user.role === "super_admin" ||
    user.role === "central_fleet_manager";

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0">
      <td className="px-5 py-4">
        <p className="font-medium text-[var(--color-text-primary)]">
          {user.name}
        </p>

        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {user.email}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="osu-badge osu-badge-success">
          {user.role}
        </span>
      </td>

      <td className="px-5 py-4 text-[var(--color-text-secondary)]">
        {user.campus_name ? (
          <>
            <p className="text-[var(--color-text-primary)]">
              {user.campus_name}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {user.campus_code} · {user.campus_city}
            </p>
          </>
        ) : (
          <span className="font-medium text-[var(--color-secondary-700)]">
            Central administration
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <span
          className={
            user.is_active
              ? "osu-badge osu-badge-success"
              : "osu-badge osu-badge-danger"
          }
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-5 py-4 text-xs text-[var(--color-text-secondary)]">
        {new Date(user.created_at).toLocaleDateString()}
      </td>

      {canManageCampus && (
        <td className="px-5 py-4">
          {isCentralRole ? (
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">
                Central role
              </span>

              <button
                type="button"
                disabled={resetting}
                onClick={() => onPasswordReset(user.id)}
                className="osu-btn osu-btn-outline mt-2 px-3 py-2 text-xs text-[var(--color-secondary-700)] disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset password"}
              </button>
            </div>
          ) : (
            <div>
              <select
                value={user.campus_id ?? ""}
                disabled={updating}
                onChange={(event) =>
                  onCampusChange(user.id, event.target.value)
                }
                className="osu-input text-xs disabled:opacity-50"
              >
                <option value="" disabled>
                  Select campus
                </option>

                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={resetting}
                onClick={() => onPasswordReset(user.id)}
                className="osu-btn osu-btn-outline mt-2 px-3 py-2 text-xs text-[var(--color-secondary-700)] disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset password"}
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="osu-card osu-card-hover p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}
