"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCentralFleetSummary,
  getCentralFuelReport,
  getCentralMaintenanceReport,
  getCentralUtilizationReport,
  type CentralFleetSummary,
  type CentralFuelReport,
  type CentralMaintenanceReport,
  type CentralUtilizationReport,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type CombinedReport = {
  fleet: CentralFleetSummary;
  fuel: CentralFuelReport;
  maintenance: CentralMaintenanceReport;
  utilization: CentralUtilizationReport;
};

export default function CentralCombinedReportPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [report, setReport] = useState<CombinedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [fleet, fuel, maintenance, utilization] = await Promise.all([
        getCentralFleetSummary(),
        getCentralFuelReport(),
        getCentralMaintenanceReport(),
        getCentralUtilizationReport(),
      ]);

      setReport({
        fleet,
        fuel,
        maintenance,
        utilization,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load combined Central report"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checkingSession) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccess) return;

    // Intentional initial data load after authorization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport();
  }, [checkingSession, user, canAccess, router, loadReport]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1B2E] text-[#8FA3B8]">
        Checking your session...
      </main>
    );
  }

  if (!user) return null;

  if (!canAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1B2E] px-6 text-center text-[#F4A6AE]">
        You do not have permission to access this report.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1B2E] px-4 py-8 text-[#EDF1F5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3A56] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9BD8EA]">
              OSU Fleet Administration
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Combined Central report
            </h1>
            <p className="mt-2 text-sm text-[#8FA3B8]">
              Organization-wide fleet, trip, fuel, maintenance, and utilization summary.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadReport()}
              className="rounded-lg bg-[#0D5890] px-4 py-2 text-sm font-medium text-white hover:bg-[#176FA8]"
            >
              Refresh report
            </button>

            <button
              type="button"
              onClick={() => router.push("/central")}
              className="rounded-lg border border-[#1E3A56] bg-[#0F2340] px-4 py-2 text-sm text-[#B7C4D1] hover:border-[#9BD8EA]"
            >
              Back to central dashboard
            </button>
          </div>
        </header>

        {error && (
          <p className="mt-6 rounded-lg bg-[#C41221]/10 p-4 text-[#F4A6AE]">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-[#8FA3B8]">
            Loading combined report...
          </p>
        )}

        {report && !loading && (
          <>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Organization overview</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Total vehicles"
                  value={report.fleet.totals.vehicles}
                />
                <Metric
                  label="Total trips"
                  value={report.fleet.totals.trips}
                />
                <Metric
                  label="Fuel cost"
                  value={formatCurrency(report.fuel.summary.total_cost)}
                />
                <Metric
                  label="Maintenance cost"
                  value={formatCurrency(
                    report.maintenance.summary.total_cost
                  )}
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Fleet status</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Metric
                  label="Available"
                  value={report.fleet.totals.availableVehicles}
                />
                <Metric
                  label="Assigned"
                  value={report.fleet.totals.assignedVehicles}
                />
                <Metric
                  label="Maintenance"
                  value={report.fleet.totals.maintenanceVehicles}
                />
                <Metric
                  label="Inactive"
                  value={report.fleet.totals.inactiveVehicles}
                />
                <Metric
                  label="Active trips"
                  value={
                    report.fleet.totals.assignedTrips +
                    report.fleet.totals.inProgressTrips
                  }
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Operating costs</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Fuel liters"
                  value={Number(
                    report.fuel.summary.total_liters
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                />
                <Metric
                  label="Fuel cost/liter"
                  value={formatCurrency(
                    report.fuel.summary.average_cost_per_liter
                  )}
                />
                <Metric
                  label="Maintenance records"
                  value={report.maintenance.summary.record_count}
                />
                <Metric
                  label="Average maintenance cost"
                  value={formatCurrency(
                    report.maintenance.summary.average_cost
                  )}
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">
                Campus comparison
              </h2>

              <div className="mt-4 overflow-x-auto rounded-xl border border-[#1E3A56]">
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead className="bg-[#0F2340] text-xs uppercase tracking-wide text-[#8FA3B8]">
                    <tr>
                      <th className="px-5 py-4">Campus</th>
                      <th className="px-5 py-4">Vehicles</th>
                      <th className="px-5 py-4">Trips</th>
                      <th className="px-5 py-4">Fuel liters</th>
                      <th className="px-5 py-4">Fuel cost</th>
                      <th className="px-5 py-4">Maintenance cost</th>
                      <th className="px-5 py-4">Utilization</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.utilization.campuses.map((campus) => {
                      const fuelCampus = report.fuel.campuses.find(
                        (item) => item.campus_id === campus.campus_id
                      );

                      const maintenanceCampus =
                        report.maintenance.campuses.find(
                          (item) => item.campus_id === campus.campus_id
                        );

                      return (
                        <tr
                          key={campus.campus_id}
                          className="border-t border-[#1E3A56]/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {campus.campus_name}
                            </p>
                            <p className="mt-1 text-xs text-[#8FA3B8]">
                              {campus.campus_code} · {campus.city}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {campus.total_vehicles}
                          </td>

                          <td className="px-5 py-4">
                            {campus.total_trips}
                          </td>

                          <td className="px-5 py-4">
                            {Number(
                              fuelCampus?.total_liters ?? 0
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="px-5 py-4">
                            {formatCurrency(fuelCampus?.total_cost ?? 0)}
                          </td>

                          <td className="px-5 py-4">
                            {formatCurrency(
                              maintenanceCampus?.total_cost ?? 0
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#9BD8EA]">
                            {Number(
                              campus.utilization_percentage
                            ).toFixed(2)}
                            %
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="mt-8 text-xs text-[#5B7086]">
              Generated {new Date(report.fuel.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  });
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-xl border border-[#1E3A56] bg-[#0F2340] p-5">
      <p className="text-xs uppercase tracking-wide text-[#8FA3B8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </article>
  );
}
