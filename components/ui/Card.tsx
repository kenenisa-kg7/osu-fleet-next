import { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  children: ReactNode;
};

export function Card({ interactive = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`osu-card ${interactive ? "osu-card-hover cursor-pointer" : ""} p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

type StatAccent = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";

const ACCENT_BAR: Record<StatAccent, string> = {
  primary: "bg-[var(--color-primary-600)]",
  secondary: "bg-[var(--color-secondary-500)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  neutral: "bg-[var(--color-text-muted)]",
};

export function StatCard({
  label,
  value,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  accent?: StatAccent;
}) {
  return (
    <article className="osu-card relative overflow-hidden p-5">
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${ACCENT_BAR[accent]}`}
        aria-hidden="true"
      />
      <p className="pl-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 pl-2 text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </article>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="osu-card animate-pulse p-5">
      <div className="h-3 w-20 rounded bg-[var(--color-surface-100)]" />
      <div className="mt-3 h-8 w-12 rounded bg-[var(--color-surface-100)]" />
    </div>
  );
}

function NavCardGlyph({ icon }: { icon?: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
      {icon ?? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M4 12h16M4 18h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

export function NavCard({
  title,
  description,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <article
      onClick={onClick}
      className={`osu-card group relative overflow-hidden p-5 transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
          : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-secondary-500)] transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden="true"
      />
      <div className="flex items-start gap-3">
        <NavCardGlyph icon={icon} />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        </div>
      </div>
      {onClick && (
        <p className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-primary-700)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Open
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </p>
      )}
    </article>
  );
}