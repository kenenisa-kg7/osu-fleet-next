"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuditLogs, type AuditLogEntry } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

function describeAction(entry: AuditLogEntry): string {
  const actor = entry.actor_name || entry.actor_email || "Someone";
  const target = entry.target_name || entry.target_email || "a user";

  switch (entry.action) {
    case "user.created":
      return `${actor} created an account for ${target} (${entry.metadata.role})`;
    case "user.role_updated":
      return `${actor} changed ${target}'s role to ${entry.metadata.role}`;
    case "user.status_updated":
      return `${actor} ${entry.metadata.isActive ? "activated" : "deactivated"} ${target}`;
    default:
      return `${actor} performed ${entry.action} on ${target}`;
  }
}

// Resolves to the same semantic tokens used everywhere else, instead of
// a one-off hex map local to this page.
function actionAccent(action: string): string {
  if (action.includes("created")) return "var(--color-primary-600)";
  if (action.includes("status")) return "var(--color-warning)";
  if (action.includes("role")) return "var(--color-primary-800)";
  return "var(--color-text-muted)";
}

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

function LogSkeleton() {
  return (
    <div className="osu-card animate-pulse p-5">
      <div className="h-3 w-3/4 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-2 h-3 w-1/4 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs(targetPage: number) {
    try {
      setLoading(true);
      setError("");
      const result = await getAuditLogs(targetPage);
      setLogs(result.auditLogs);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load audit logs");
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
    // This effect intentionally loads audit logs when the page or page number changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs(page);
  }, [checkingSession, user, router, page]);

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-50)] p-8 text-[var(--color-text-muted)]">
        Checking your session...
      </main>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <main className="relative min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_60%_at_15%_0%,rgba(107,195,221,0.16),transparent),radial-gradient(55%_50%_at_90%_0%,rgba(27,87,64,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl p-6 sm:p-10">
        <BackLink onClick={() => router.push("/dashboard")} />

        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-700)] uppercase">
          Administrator workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Audit history</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          A record of administrative changes made across the system.
        </p>

        {error && (
          <p role="alert" className="osu-alert-error mt-6">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-3">
          {loading &&
            logs.length === 0 &&
            Array.from({ length: 4 }).map((_, index) => <LogSkeleton key={index} />)}

          {!loading && logs.length === 0 && (
            <p className="osu-card p-6 text-[var(--color-text-muted)]">
              No audit entries yet.
            </p>
          )}

          {logs.map((entry) => (
            <article
              key={entry.id}
              className="osu-card osu-card-hover relative overflow-hidden p-5"
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: actionAccent(entry.action) }}
                aria-hidden="true"
              />
              <p className="pl-2 text-sm text-[var(--color-text-primary)]">{describeAction(entry)}</p>
              <p className="mt-2 pl-2 text-xs text-[var(--color-text-muted)]">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </article>
          ))}
        </section>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-400)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-400)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}