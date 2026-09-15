"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Button } from "./ui/Button";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  staff: "Staff",
  driver: "Driver",
  super_admin: "Super Admin",
  central_fleet_manager: "Central Fleet Manager",
  fleet_officer: "Fleet Officer",
  transport_unit: "Transport Unit",
  requester: "Requester",
  viewer: "Viewer",
};

export function AppHeader({
  title = "Fleet Operations",
  eyebrow = "Oromia State University",
}: {
  title?: string;
  eyebrow?: string;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-0)]/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:-mx-12 lg:px-12">
      <div className="flex items-center gap-4">
        <Logo size={40} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary-600)]">
            {eyebrow}
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-50)] py-1 pr-3 pl-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-700)] text-[11px] font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-xs font-medium text-[var(--color-text-secondary)] sm:inline">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}