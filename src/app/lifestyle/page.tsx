"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageNav from "@/components/PageNav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LifestyleInsightResponse } from "@/lib/types";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const ScoreGauge = ({ score }: { score: number }) => {
  const angle = (clamp(score, 0, 100) / 100) * 180;
  const tone =
    score >= 80 ? "text-leaf" : score >= 60 ? "text-gold" : score >= 40 ? "text-ember" : "text-ember";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs work" : "At risk";

  return (
    <div className="card">
      <p className="section-title">Lifestyle score</p>
      <h3 className="mt-2 text-lg font-semibold">Your lifestyle rating</h3>
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="relative h-28 w-56">
          <div className="absolute inset-0 rounded-t-full border-[12px] border-slate/15 border-b-0" />
          <div
            className="absolute inset-0 rounded-t-full border-[12px] border-emerald-400 border-b-0"
            style={{ clipPath: "inset(0 0 0 0)" }}
          />
          <div
            className="absolute left-1/2 bottom-0 h-20 w-1 origin-bottom rounded-full bg-ink"
            style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
          />
        </div>
        <div className="text-center">
          <div className="text-4xl font-semibold text-ink">{score}</div>
          <div className={`mt-1 text-sm font-semibold ${tone}`}>{label}</div>
        </div>
      </div>
    </div>
  );
};

const InsightSummary = ({
  insight
}: {
  insight: LifestyleInsightResponse | null;
}) => (
  <div className="card">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="section-title">Lifestyle narrative</p>
        <h3 className="mt-2 text-lg font-semibold">AI interpretation</h3>
      </div>
      <span className="badge bg-aqua/10 text-aqua">AI analysis</span>
    </div>
    <p className="mt-4 text-sm text-slate/70">
      {insight?.summary ?? "Generate a lifestyle insight to see your personalized summary."}
    </p>
    {insight ? (
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate/10 bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate/60">Life expectancy estimate</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{insight.life_expectancy_years} years</p>
          <p className="mt-2 text-xs text-slate/50">{insight.disclaimer}</p>
        </div>
        <div className="rounded-xl border border-slate/10 bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate/60">Good habits</p>
          <ul className="mt-3 space-y-2 text-sm text-slate/70">
            {insight.good_habits.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ) : null}
  </div>
);

const PillList = ({
  title,
  items,
  accent
}: {
  title: string;
  items: string[];
  accent: string;
}) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <p className="section-title">{title}</p>
      <span className={`badge ${accent}`}>Live</span>
    </div>
    <div className="mt-4 space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center justify-between rounded-xl border border-slate/10 bg-white/80 px-4 py-3 text-sm text-slate/70">
          <span>{item}</span>
          <span className="text-ink">→</span>
        </div>
      ))}
    </div>
  </div>
);

export default function LifestylePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [insight, setInsight] = useState<LifestyleInsightResponse | null>(null);
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
    const response = await fetch("/api/lifestyle-insight", { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setInsight(payload.data as LifestyleInsightResponse);
    } else {
      setError(payload.error ?? "Unable to generate lifestyle insight.");
    }
    setLoading(false);
  };

  const suggestions = insight?.ai_suggestions ?? [];
  const tips = insight?.health_tips ?? [];
  const improvements = insight?.improvement_areas ?? [];

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="card">
          <p className="section-title">Rate your lifestyle</p>
          <h1 className="mt-2 text-3xl font-semibold">Lifestyle score & longevity outlook</h1>
          <p className="mt-2 text-sm text-slate/70">
            This analysis is generated from the habits you share in “Tell me about your habits.”
          </p>
          <div className="mt-4">
            <PageNav />
          </div>
          <button className="button-primary mt-5" onClick={generate} disabled={loading}>
            {loading ? "Analyzing..." : "Generate lifestyle insight"}
          </button>
          {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <ScoreGauge score={insight?.lifestyle_score ?? 0} />
            <PillList title="AI suggestions" items={suggestions.length ? suggestions : ["Generate insight to see suggestions."]} accent="bg-ember/10 text-ember" />
          </div>
          <div className="space-y-8">
            <InsightSummary insight={insight} />
            <PillList title="Health tips" items={tips.length ? tips : ["Generate insight to see health tips."]} accent="bg-leaf/10 text-leaf" />
            <PillList title="Areas to improve" items={improvements.length ? improvements : ["Generate insight to see improvement areas."]} accent="bg-gold/10 text-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}
