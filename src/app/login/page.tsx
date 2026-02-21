"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(
    () => (typeof window === "undefined" ? null : createSupabaseBrowserClient()),
    []
  );
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!supabase) {
        setMessage("Auth is not ready yet. Please try again.");
        setLoading(false);
        return;
      }
      const action =
        mode === "signin"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });

      const { error } = await action;
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the auth server. Please try again.";
      setMessage(message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-radial-grid px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-center gap-7">
          <span className="badge bg-ink text-white w-fit">NeuroVital</span>
          <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Unified Health Intelligence Platform
          </h1>
          <p className="text-base text-slate/80">
            Bring together structured medical insights and longitudinal mental wellness reflection in one
            secure dashboard.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              "Personalized Preventive Guidance",
              "Integrated Vitals & Laboratory Data",
              "Mental Wellness Trajectory",
              "Therapeutic Reflection Tools"
            ].map((item) => (
              <div key={item} className="card">
                <p className="text-sm font-semibold text-slate">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Access</p>
              <h2 className="mt-2 text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h2>
            </div>
            <button
              className="button-secondary"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              type="button"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-slate">Email</label>
              <input
                className="input mt-2"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate">Password</label>
              <input
                className="input mt-2"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
              />
            </div>
            {message ? <p className="text-sm text-ember">{message}</p> : null}
            <button className="button-primary w-full" disabled={loading} type="submit">
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

