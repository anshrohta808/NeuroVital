"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  MedicalInsightResponse,
  MoodLogInput,
  FamilyHistoryInput,
  LabReportMetrics,
  VitalsInput,
} from "@/lib/types";
import { computeBMI, computeRiskTags } from "@/lib/riskRules";
import ChatWidget from "@/components/ChatWidget";
import MoodTrendChart from "@/components/MoodTrendChart";
import ManualHealthForm from "@/components/ManualHealthForm";
import MoodLogForm from "@/components/MoodLogForm";
import PdfUploadForm from "@/components/PdfUploadForm";
import PageNav from "@/components/PageNav";

export default function DashboardPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => (typeof window === "undefined" ? null : createSupabaseBrowserClient()),
    [],
  );

  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<VitalsInput | null>(null);
  const [familyHistory, setFamilyHistory] = useState<FamilyHistoryInput | null>(
    null,
  );
  const [labMetrics, setLabMetrics] = useState<LabReportMetrics | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodLogInput[]>([]);
  const [medicalInsight, setMedicalInsight] =
    useState<MedicalInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.push("/login");
      return;
    }

    const userId = session.user.id;

    const [
      { data: vitalsData },
      { data: familyData },
      { data: labData },
      { data: moodData },
    ] = await Promise.all([
      supabase
        .from("vitals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("family_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("lab_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("mood_logs")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(14),
    ]);

    setVitals((vitalsData?.[0] as VitalsInput) ?? null);
    setFamilyHistory((familyData?.[0] as FamilyHistoryInput) ?? null);
    setLabMetrics((labData?.[0] as LabReportMetrics) ?? null);
    setMoodLogs((moodData as MoodLogInput[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const riskTags = computeRiskTags(vitals, familyHistory, labMetrics);
  const bmi = vitals ? computeBMI(vitals.height_cm, vitals.weight_kg) : null;

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    const response = await fetch("/api/medical-insight", { method: "POST" });
    const payload = await response.json();

    if (response.ok) {
      setMedicalInsight(payload.data as MedicalInsightResponse);
    }

    setInsightLoading(false);
  };

  const signOut = async () => {
    if (!supabase) {
      router.push("/login");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-title">NeuroVital</p>
            <h1 className="mt-2 text-3xl font-semibold">
              Preventive Health Command Center
            </h1>
            <p className="mt-2 text-sm text-slate/70">
              One seamless view of your complete health profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              className="button-secondary"
              onClick={handleGenerateInsight}
              disabled={insightLoading}
            >
              {insightLoading ? "Generating..." : "Generate medical insight"}
            </button>

            <button className="button-primary" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <div className="flex w-full justify-center">
          <PageNav />
        </div>

        {loading ? (
          <div className="card">Loading your health data...</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <ManualHealthForm
                initialVitals={vitals}
                initialFamilyHistory={familyHistory}
                onSaved={fetchData}
              />
            </div>

            <div className="space-y-8">
              <MoodTrendChart
                data={moodLogs.map((item) => ({
                  logged_at: item.logged_at ?? new Date().toISOString(),
                  mood_score: item.mood_score,
                }))}
              />
              <MoodLogForm onSaved={fetchData} />
              <PdfUploadForm />
              <ChatWidget />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
