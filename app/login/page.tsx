import { Logo } from "../../components/Logo";
import { LoginForm } from "./LoginForm";

const FEATURES = [
  {
    title: "Submit requests",
    description: "File and track your transport requests.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Track progress",
    description: "Monitor request status in real time.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3v18h18M7 15l4-4 3 3 5-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-50)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-0)] shadow-[var(--shadow-card-hover)] md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-6 border-b border-[var(--color-border)] p-8 text-center sm:p-10 md:border-b-0 md:border-r">
          <Logo size={96} />

          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              OSU Fleet Portal
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Your gateway to campus transport and fleet operations.
            </p>
          </div>

          <div className="w-full space-y-4 text-left">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {feature.title}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
            Oromia State University
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Sign in to your OSU Fleet account
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}