"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, checkingSession, logout } = useAuth();

  useEffect(() => {
    if (!checkingSession && !user) {
      router.push("/login");
    }
  }, [checkingSession, user, router]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-300">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Welcome, {user.name}</h1>
        <p className="mt-2 text-slate-300">Role: {user.role}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
        >
          Log out
        </button>
      </div>
    </main>
  );
}