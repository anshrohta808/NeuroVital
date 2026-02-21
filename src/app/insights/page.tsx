"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MedicalInsightResponse } from "@/lib/types";
import PageNav from "@/components/PageNav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function InsightsPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [insight, setInsight] = useState<MedicalInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      }
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/medical-insight", { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setInsight(payload.data);
    } else {
      setError(payload.error ?? "Unable to generate insight.");
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="card">
          <p className="section-title">Medical insight engine</p>
          <h1 className="mt-2 text-3xl font-semibold">Structured preventive analysis</h1>
          <p className="mt-2 text-sm text-slate/70">
            The engine returns dashboard-ready JSON. It does not diagnose or prescribe.
          </p>
          <div className="mt-4">
            <PageNav />
          </div>
          <button className="button-primary mt-5" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate insight"}
          </button>
          {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
        </div>

        {insight ? (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="card">
              <p className="section-title">Risk summary</p>
              <p className="mt-3 text-sm text-slate/70">{insight.risk_summary}</p>
              <p className="mt-4 text-xs text-slate/50">{insight.disclaimer}</p>
            </div>
            <div className="card">
              <p className="section-title">Current red flags</p>
              <ul className="mt-3 space-y-2 text-sm text-slate/70">
                {insight.current_red_flags.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <p className="section-title">Preventive actions</p>
              <ul className="mt-3 space-y-2 text-sm text-slate/70">
                {insight.preventive_actions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <p className="section-title">Lifestyle improvements</p>
              <ul className="mt-3 space-y-2 text-sm text-slate/70">
                {insight.lifestyle_improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card md:col-span-2">
              <p className="section-title">Consult doctor if</p>
              <ul className="mt-3 space-y-2 text-sm text-slate/70">
                {insight.consult_doctor_if.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
