"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getFleetSummary, type FleetSummary } from "../../lib/api";

type DashboardCardProps = {
  title: string;
  description: string;
  onClick?: () => void;
};

function DashboardCard({ title, description, onClick }: DashboardCardProps) {
  return (
    <article
      onClick={onClick}
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${
        onClick ? "cursor-pointer transition hover:border-emerald-400/40" : ""
      }`}
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </article>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, checkingSession, logout } = useAuth();

  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace("/login");
    }
  }, [checkingSession, user, router]);

  useEffect(() => {
    const canViewSummary = user?.role === "admin" || user?.role === "staff";

    if (!canViewSummary) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError("");

    getFleetSummary()
      .then(setSummary)
      .catch((error) => {
        setSummaryError(
          error instanceof Error ? error.message : "Could not load fleet summary"
        );
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [user]);

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Oromia State University
            </p>
            <h1 className="mt-2 text-3xl font-bold">Fleet Operations</h1>
            <p className="mt-2 text-slate-400">
              Welcome back, {user.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Log out
          </button>
        </header>

        <section className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <p className="text-sm text-slate-400">Signed in as</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-semibold text-white">{user.email}</span>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
              {user.role}
            </span>
          </div>
        </section>

        {(user.role === "admin" || user.role === "staff") && (
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Fleet summary</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Current operational activity across OSU transport services.
                </p>
              </div>
              {summary && (
                <p className="text-xs text-slate-500">
                  Updated {new Date(summary.generatedAt).toLocaleString()}
                </p>
              )}
            </div>

            {summaryLoading && (
              <p className="mt-5 text-slate-400">Loading fleet summary...</p>
            )}

            {summaryError && (
              <p role="alert" className="mt-5 rounded-lg bg-red-400/10 p-4 text-red-300">
                {summaryError}
              </p>
            )}

            {summary && !summaryLoading && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Pending trips" value={summary.trips.pending} />
                <MetricCard label="Active trips" value={summary.trips.assigned + summary.trips.in_progress} />
                <MetricCard label="Available vehicles" value={summary.vehicles.available} />
                <MetricCard label="In maintenance" value={summary.vehicles.maintenance} />
                <MetricCard label="Completed trips" value={summary.trips.completed} />
                <MetricCard label="Unread alerts" value={summary.notifications.unread} />
              </div>
            )}
          </section>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(user.role === "admin" || user.role === "staff") && (
            <>
              <DashboardCard
                title="Trip requests"
                description="Create, review, filter, and track university transportation requests."
                onClick={() => router.push("/trips")}
              />
              <DashboardCard
                title="Fleet summary"
                description="View pending trips, assigned vehicles, maintenance, and operational activity."
              />
            </>
          )}

                   {user.role === "admin" && (
            <>
              <DashboardCard
                title="Manage all trip requests"
                description="Review, approve, reject, and filter every trip request in the system."
                onClick={() => router.push("/admin/trips")}
              />
                          <DashboardCard
                title="Vehicle management"
                description="Manage vehicles, availability, maintenance records, and assignments."
                onClick={() => router.push("/admin/vehicles")}
              />
              <DashboardCard
                title="User management"
                description="Create operational accounts and manage staff and driver access."
              />
              <DashboardCard
                title="Audit history"
                description="Review administrative changes and trip status history."
              />
            </>
          )}

          {user.role === "driver" && (
            <>
              <DashboardCard
                title="Assigned trips"
                description="View trips assigned to you and check pickup details."
              />
              <DashboardCard
                title="Trip progress"
                description="Start and complete assigned trips while recording final mileage and notes."
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}