import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-medium text-emerald-300">
          Oromia State University
        </p>
        <h1 className="mt-4 text-3xl font-bold text-white">
          OSU Fleet Management
        </h1>
        <h2 className="mt-2 text-lg text-slate-300">Sign in</h2>
        <LoginForm />
      </div>
    </main>
  );
}