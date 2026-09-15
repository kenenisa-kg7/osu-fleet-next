"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
  actions,
}: {
  eyebrow?: string;
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-primary-700)] transition hover:text-[var(--color-primary-800)]"
        >
          ← {backLabel}
        </button>

        {eyebrow && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">{title}</h1>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}