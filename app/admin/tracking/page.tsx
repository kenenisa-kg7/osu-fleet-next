"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getVehicleLocations,
  type VehicleLocation,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const VehicleMap = dynamic(() => import("./VehicleMap"), {
  ssr: false,
});

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="osu-btn osu-btn-outline px-3 py-2 text-sm"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M19 12H5M11 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back to dashboard
    </button>
  );
}

function VehicleRowSkeleton() {
  return (
    <div className="osu-card animate-pulse p-4">
      <div className="h-3 w-1/3 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-3 w-1/4 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-3 w-1/2 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

const STATUS_STYLES: Record<
  string,
  {
    color: string;
    background: string;
    border: string;
  }
> = {
  available: {
    color: "var(--color-success)",
    background: "var(--color-success-bg)",
    border: "var(--color-primary-200)",
  },
  assigned: {
    color: "var(--color-primary-800)",
    background: "var(--color-primary-50)",
    border: "var(--color-primary-200)",
  },
  maintenance: {
    color: "var(--color-secondary-700)",
    background: "var(--color-secondary-50)",
    border: "var(--color-secondary-200)",
  },
  inactive: {
    color: "var(--color-text-muted)",
    background: "var(--color-surface-100)",
    border: "var(--color-border)",
  },
};

export default function TrackingPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "admin" || user?.role === "staff";

  async function loadLocations() {
    try {
      setError("");

      const result = await getVehicleLocations();
      setLocations(result.vehicleLocations);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load vehicle locations"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingSession) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccess) {
      router.replace("/dashboard");
      return;
    }

    // This effect intentionally loads live vehicle locations on page entry.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLocations();

    const interval = setInterval(() => {
      void loadLocations();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkingSession, user, router, canAccess]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Checking your session...
      </main>
    );
  }

  if (!user || !canAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 text-[var(--color-text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-[var(--color-border)] pb-6">
          <BackLink onClick={() => router.push("/dashboard")} />

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
              Oromia State University
            </p>

            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Live vehicle tracking
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                  Real-time positions from vehicles reporting GPS data.
                  Location data refreshes every 15 seconds.
                </p>
              </div>

              <span className="osu-badge osu-badge-success">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
                  aria-hidden="true"
                />
                Live updates
              </span>
            </div>
          </div>
        </header>

        {error && (
          <p role="alert" className="osu-alert-error mt-6 text-sm">
            {error}
          </p>
        )}

        {loading && (
          <div
            className="osu-card mt-6 flex h-[500px] animate-pulse items-center justify-center"
            aria-label="Loading vehicle map"
          >
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]"
                aria-hidden="true"
              />
              Loading live vehicle locations...
            </div>
          </div>
        )}

        {!loading && locations.length === 0 && !error && (
          <div className="osu-card mt-6 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 17h14M7 17V9l2-3h6l2 3v8M9 17v2m6-2v2M8 10h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="mt-4 font-semibold text-[var(--color-text-primary)]">
              No live vehicles
            </h2>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              No vehicles have reported a location yet.
            </p>
          </div>
        )}

        {!loading && locations.length > 0 && (
          <section
            aria-label="Live vehicle map"
            className="osu-card mt-6 overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                  Fleet locations
                </p>

                <h2 className="mt-1 font-semibold">
                  Vehicles on the map
                </h2>
              </div>

              <span className="osu-badge osu-badge-neutral">
                {locations.length} vehicle
                {locations.length === 1 ? "" : "s"} reporting
              </span>
            </div>

            <div className="h-[500px]">
              <VehicleMap locations={locations} />
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
                Fleet status
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Reporting vehicles
              </h2>
            </div>

            {!loading && locations.length > 0 && (
              <p className="
