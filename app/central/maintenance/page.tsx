"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCentralMaintenanceReport,
  type CentralMaintenanceReport,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function CentralMaintenanceReportPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  const [report, setReport] =
    useState<CentralMaintenanceReport | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "super_admin" ||
    user?.role === "central_fleet_manager";

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCentralMaintenanceReport({
        from: from || undefined,
        to: to || undefined,
      });

      setReport(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load maintenance report"
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (checkingSession) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccess) {
      return;
    }

    // Intentional initial data load after authorization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport();
  }, [checkingSession, user, canAccess, router, loadReport]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-sm text-[var(--color-text-secondary)]">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!canAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-50)] px-6 text-center">
        <div className="osu-card max-w-md p-8">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Access restricted
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You do not have permission to access this report.
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
              Organization-wide maintenance report
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Maintenance activity and costs across all OSU campuses.
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
            Back to central dashboard
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadReport();
          }}
          className="osu-card mt-8 grid gap-4 p-5 sm:grid-cols-3 sm:p-6"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              From date
            </span>

            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="osu-input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-text-primary)]">
              To date
            </span>

            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="osu-input"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="osu-btn osu-btn-primary min-h-[42px] w-full"
            >
              Apply filters
            </button>
          </div>
        </form>

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

            Loading maintenance report...
          </div>
        )}

        {report && !loading && (
          <>
            <section
              aria-label="Maintenance report summary"
              className="mt-8 grid gap-4 sm:grid-cols-3"
            >
              <Metric
                label="Maintenance records"
                value={String(report.summary.record_count)}
              />

              <Metric
                label="Total cost"
                value={formatCurrency(report.summary.total_cost)}
              />

              <Metric
                label="Average cost"
                value={formatCurrency(report.summary.average_cost)}
              />
            </section>

            <ReportTable
              title="Maintenance cost by campus"
              eyebrow="Campus analysis"
              headers={["Campus", "Records", "Total cost", "Average cost"]}
            >
              {report.campuses.length > 0 ? (
                report.campuses.map((campus) => (
                  <tr
                    key={campus.campus_id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {campus.campus_name}
                      </p>

                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {campus.campus_code}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {campus.record_count}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {formatCurrency(campus.total_cost)}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {formatCurrency(campus.average_cost)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={4}
                  message="No campus maintenance data found for the selected period."
                />
              )}
            </ReportTable>

            <ReportTable
              title="Maintenance cost by type"
              eyebrow="Service categories"
              headers={["Type", "Records", "Total cost", "Average cost"]}
            >
              {report.maintenanceTypes.length > 0 ? (
                report.maintenanceTypes.map((item) => (
                  <tr
                    key={item.maintenance_type}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-5 py-4 capitalize text-[var(--color-text-primary)]">
                      {item.maintenance_type}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {item.record_count}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {formatCurrency(item.total_cost)}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {formatCurrency(item.average_cost)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={4}
                  message="No maintenance categories found for the selected period."
                />
              )}
            </ReportTable>

            <ReportTable
              title="Maintenance transaction details"
              eyebrow="Transaction log"
              headers={[
                "Date",
                "Vehicle",
                "Campus",
                "Type",
                "Description",
                "Cost",
              ]}
              tableClassName="min-w-[1100px]"
            >
              {report.records.length > 0 ? (
                report.records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--color-text-secondary)]">
                      {new Date(
                        record.performed_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {record.registration_number}
                      </p>

                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {record.make} {record.model}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {record.campus_name}
                    </td>

                    <td className="px-5 py-4 capitalize text-[var(--color-text-secondary)]">
                      {record.maintenance_type}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-[var(--color-text-secondary)]">
                      {record.description}
                    </td>

                    <td className="px-5 py-4 text-[var(--color-text-secondary)]">
                      {formatCurrency(record.cost ?? 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={6}
                  message="No maintenance records found for the selected period."
                />
              )}
            </ReportTable>
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
  value: string;
}) {
  return (
    <article className="osu-card osu-card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {label}
        </p>

        <span
          className="h-2 w-2 rounded-full bg-[var(--color-primary-400)]"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}

function ReportTable({
  title,
  eyebrow,
  headers,
  children,
  tableClassName = "min-w-[700px]",
}: {
  title: string;
  eyebrow: string;
  headers: string[];
  children: ReactNode;
  tableClassName?: string;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary-600)]">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>
      </div>

      <div className="osu-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${tableClassName} text-left text-sm`}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-50)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-5 py-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function EmptyTableRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]"
      >
        {message}
      </td>
    </tr>
  );
}
