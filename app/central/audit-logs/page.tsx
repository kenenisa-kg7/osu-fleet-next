"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  getCentralAuditLogs,
  type CentralAuditLog,
  type CentralAuditLogPage,
} from "../../../lib/api";

export default function CentralAuditLogsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [result, setResult] = useState<CentralAuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  async function loadAuditLogs() {
    setLoading(true);
    setError("");

    try {
      const data = await getCentralAuditLogs();
      setResult(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load central audit logs"
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

    // This effect intentionally loads audit logs when central access is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAuditLogs();
  }, [canAccess]);

  if (checkingSession || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
        Checking your session...
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 text-center text-red-600">
        You do not have permission to access this page.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              OSU Fleet Administration
            </p>

            <h1 className="mt-2 text-2xl font-bold text-stone-900">
              Central Audit History
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Review organization-wide administrative actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadAuditLogs()}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition hover:border-sky-300 hover:text-sky-600"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => router.push("/central")}
              className="rounded-xl bg-sky-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-sky-400"
            >
              Central dashboard
            </button>
          </div>
        </header>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-stone-500">
            Loading audit history...
          </p>
        )}

        {result && !loading && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-5 py-4">
              <h2 className="font-semibold text-stone-900">Administrative actions</h2>

              <p className="mt-1 text-xs text-stone-500">
                {result.pagination.total} total audit records
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Actor</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Target</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {result.auditLogs.map((log) => (
                    <AuditRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {result.auditLogs.length === 0 && (
              <p className="p-6 text-center text-stone-400">
                No audit records found.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function AuditRow({ log }: { log: CentralAuditLog }) {
  return (
    <tr className="border-b border-stone-100 align-top last:border-b-0">
      <td className="whitespace-nowrap px-5 py-4 text-xs text-stone-500">
        {new Date(log.created_at).toLocaleString()}
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-stone-900">
          {log.actor_name ?? "Unknown actor"}
        </p>

        <p className="mt-1 text-xs text-stone-500">
          {log.actor_email ?? "No email"}
        </p>

        {log.actor_role && (
          <span className="mt-2 inline-block rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-600">
            {log.actor_role}
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
          {log.action}
        </span>
      </td>

      <td className="px-5 py-4">
        {log.target_name ? (
          <>
            <p className="text-stone-900">{log.target_name}</p>
            <p className="mt-1 text-xs text-stone-500">
              {log.target_email ?? "No email"}
            </p>
          </>
        ) : (
          <span className="text-stone-400">No user target</span>
        )}
      </td>

      <td className="max-w-[320px] px-5 py-4">
        <pre className="whitespace-pre-wrap break-words rounded-lg bg-stone-50 p-2 text-xs text-stone-600">
          {JSON.stringify(log.metadata, null, 2)}
        </pre>
      </td>
    </tr>
  );
}