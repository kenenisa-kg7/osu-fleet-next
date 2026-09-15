import Link from "next/link";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";

const LIFECYCLE = [
  {
    number: "01",
    title: "Request",
    detail: "Staff submit a trip: origin, destination, purpose, passengers.",
  },
  {
    number: "02",
    title: "Approve",
    detail: "An administrator reviews the request and approves or rejects it.",
  },
  {
    number: "03",
    title: "Assign",
    detail: "A vehicle and driver are matched to the approved trip.",
  },
  {
    number: "04",
    title: "Complete",
    detail: "The driver logs closing mileage and notes at drop-off.",
  },
];

const STOPS = [
  { label: "Staff", note: "Submit and track requests" },
  { label: "Driver", note: "Accept and close out trips" },
  { label: "Administrator", note: "Approve, assign, oversee the fleet" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8 sm:pt-8 lg:px-12">
        <nav className="flex items-center justify-end">
          <Link href="/login">
            <Button variant="primary">Sign in</Button>
          </Link>
        </nav>

        <div className="mt-8 flex flex-col items-center text-center sm:mt-10">
          <Logo size={72} className="sm:hidden" />
          <Logo size={88} className="hidden sm:block" />
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-secondary-600)] sm:mt-5 sm:text-sm">
            Oromia State University
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
            Transport &amp; Fleet Operations
          </p>

          <h1 className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tight text-[var(--color-text-primary)] sm:mt-8 sm:text-6xl lg:text-7xl">
            Fleet
            <br />
            command
            <br />
            center
          </h1>

          <p className="mt-5 max-w-xs text-base text-[var(--color-text-secondary)] sm:mt-6 sm:max-w-lg sm:text-lg">
            One system to request, approve, assign, and close out every
            vehicle trip on campus — from the first ask to the final mileage
            log.
          </p>

          <Link href="/login" className="mt-7 sm:mt-8">
            <Button variant="primary" size="lg">
              Sign in
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex justify-center sm:mt-16">
          <div className="osu-card w-full max-w-md p-5 sm:max-w-lg sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary-700)]">
              Trip lifecycle
            </p>
            <ol className="mt-4 space-y-4 text-left sm:space-y-5">
              {LIFECYCLE.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="text-2xl font-black text-[var(--color-primary-200)]">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-4 sm:mt-20 sm:px-8 lg:px-12">
        <svg
          className="route-line h-10 w-full"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 20 H1200"
            stroke="var(--color-border-strong)"
            strokeWidth="2"
            strokeDasharray="2 10"
            fill="none"
          />
        </svg>

        <div className="mt-4 grid grid-cols-1 gap-6 pb-16 sm:grid-cols-3 sm:gap-8 sm:pb-20">
          {STOPS.map((stop) => (
            <div key={stop.label} className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary-600)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {stop.label}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {stop.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-[var(--color-border)] px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">Oromia State University</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Transport and Fleet Operations
          </p>
        </div>
      </footer>
    </main>
  );
}