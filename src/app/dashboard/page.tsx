"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MedicalInsightResponse, MoodLogInput, FamilyHistoryInput, LabReportMetrics, VitalsInput } from "@/lib/types";
import { computeBMI, computeRiskTags } from "@/lib/riskRules";
import ChatWidget from "@/components/ChatWidget";
import MoodTrendChart from "@/components/MoodTrendChart";
import ManualHealthForm from "@/components/ManualHealthForm";
import MoodLogForm from "@/components/MoodLogForm";
import PdfUploadForm from "@/components/PdfUploadForm";
import PageNav from "@/components/PageNav";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const sanitizePdfText = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();

const wrapPdfLine = (value: string, maxLength = 90) => {
  if (!value) return [""];
  const words = value.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!word) return;
    if (word.length > maxLength) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxLength) {
        lines.push(word.slice(i, i + maxLength));
      }
      return;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
};

const buildInsightPdfLines = (insight: MedicalInsightResponse) => {
  const lines: string[] = [];
  const date = new Date().toLocaleString();

  lines.push("NeuroVital Medical Insight Report");
  lines.push(`Generated: ${date}`);
  lines.push("");
  lines.push("Risk Summary:");
  lines.push(insight.risk_summary);
  lines.push("");
  lines.push("Current Red Flags:");
  (insight.current_red_flags ?? []).forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("Preventive Actions:");
  (insight.preventive_actions ?? []).forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("Lifestyle Improvements:");
  (insight.lifestyle_improvements ?? []).forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("Consult Doctor If:");
  (insight.consult_doctor_if ?? []).forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("Disclaimer:");
  lines.push(insight.disclaimer);

  return lines.flatMap((line) => wrapPdfLine(sanitizePdfText(line)));
};

const createPdfBlob = (lines: string[]) => {
  const encoder = new TextEncoder();
  const byteLength = (value: string) => encoder.encode(value).length;
  const content = [
    "BT",
    "/F1 12 Tf",
    "16 TL",
    "72 720 Td",
    ...lines.map((line) => `(${escapePdfText(line)}) Tj`),
    "ET"
  ].join("\n");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`;
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = "%PDF-1.3\n";
  const objects = [obj1, obj2, obj3, obj4, obj5];
  const offsets: number[] = [];
  let pdf = header;
  let offset = byteLength(header);

  objects.forEach((obj) => {
    offsets.push(offset);
    pdf += obj;
    offset += byteLength(obj);
  });

  const xrefOffset = offset;
  const xref =
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets.map((entry) => `${String(entry).padStart(10, "0")} 00000 n \n`).join("");
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  pdf += xref + trailer;

  return new Blob([pdf], { type: "application/pdf" });
};

const downloadPdf = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<VitalsInput | null>(null);
  const [familyHistory, setFamilyHistory] = useState<FamilyHistoryInput | null>(null);
  const [labMetrics, setLabMetrics] = useState<LabReportMetrics | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodLogInput[]>([]);
  const [medicalInsight, setMedicalInsight] = useState<MedicalInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      router.push("/login");
      return;
    }

    const userId = session.user.id;
    const [{ data: vitalsData }, { data: familyData }, { data: labData }, { data: moodData }] =
      await Promise.all([
        supabase.from("vitals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
        supabase.from("family_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
        supabase.from("lab_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
        supabase.from("mood_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(14)
      ]);

    setVitals((vitalsData?.[0] as VitalsInput) ?? null);
    setFamilyHistory((familyData?.[0] as FamilyHistoryInput) ?? null);
    setLabMetrics((labData?.[0] as LabReportMetrics) ?? null);
    setMoodLogs((moodData as MoodLogInput[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await supabase.auth.signOut();
    router.push("/login");
  };

  const downloadInsight = () => {
    if (!medicalInsight) return;
    const lines = buildInsightPdfLines(medicalInsight);
    const blob = createPdfBlob(lines);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadPdf(blob, `preventai-insight-${dateStamp}.pdf`);
  };

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-title">NeuroVital</p>
            <h1 className="mt-2 text-3xl font-semibold">Preventive Health Command Center</h1>
            <p className="mt-2 text-sm text-slate/70">
              One seamless view of your complete health profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="button-secondary" onClick={handleGenerateInsight} disabled={insightLoading}>
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
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card">
                  <p className="section-title">Risk indicator</p>
                  <h3 className="mt-2 text-lg font-semibold">Current risk posture</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-semibold text-ink">{riskTags.length}</p>
                      <p className="text-sm text-slate/70">Active preventive flags</p>
                    </div>
                    <span
                      className={`badge ${
                        riskTags.length > 1
                          ? "bg-ember/20 text-ember"
                          : riskTags.length === 1
                          ? "bg-gold/20 text-gold"
                          : "bg-leaf/20 text-leaf"
                      }`}
                    >
                      {riskTags.length > 1 ? "Elevated" : riskTags.length === 1 ? "Watch" : "Stable"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate/70">
                    BMI: {bmi ?? "n/a"} | Latest vitals snapshot
                  </p>
                </div>

                <div className="card">
                  <p className="section-title">Red flags</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {medicalInsight?.current_red_flags?.length ? "AI-generated alerts" : "Rule-based alerts"}
                  </h3>
                  <ul className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-2 text-sm text-slate/80">
                    {medicalInsight?.current_red_flags?.length ? (
                      medicalInsight.current_red_flags.map((flag, index) => (
                        <li
                          key={`${flag}-${index}`}
                          className="rounded-xl border border-slate/10 bg-white/80 p-3 leading-relaxed"
                        >
                          {flag}
                        </li>
                      ))
                    ) : riskTags.length === 0 ? (
                      <li className="rounded-xl border border-slate/10 bg-white/80 p-3 leading-relaxed">
                        No alerts yet.
                      </li>
                    ) : (
                      riskTags.map((tag) => (
                        <li key={tag.label} className="rounded-xl border border-slate/10 bg-white/80 p-3 leading-relaxed">
                          <span className="font-semibold text-slate">{tag.label}</span>: {tag.reason}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="section-title">Preventive actions</p>
                    <h3 className="mt-2 text-lg font-semibold">Latest insight output</h3>
                  </div>
                  <span className="badge bg-aqua/10 text-aqua">Medical engine</span>
                </div>
                {medicalInsight ? (
                  <div className="mt-4 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-slate">Summary</p>
                        <p className="mt-2 text-sm text-slate/70">{medicalInsight.risk_summary}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate">Preventive actions</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate/70">
                          {medicalInsight.preventive_actions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="button-secondary" onClick={downloadInsight}>
                        Download insight (PDF)
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate/70">
                    Generate a medical insight to populate preventive actions and red flags.
                  </p>
                )}
              </div>

              <ManualHealthForm
                initialVitals={vitals}
                initialFamilyHistory={familyHistory}
                onSaved={fetchData}
              />
            </div>

            <div className="space-y-8">
              <div className="card">
                <p className="section-title">Lab metrics</p>
                <h3 className="mt-2 text-lg font-semibold">Latest parsed markers</h3>
                <div className="mt-4 grid gap-4 text-sm text-slate/70 md:grid-cols-2">
                  {[
                    { label: "Hemoglobin", value: labMetrics?.hemoglobin },
                    { label: "Cholesterol", value: labMetrics?.cholesterol },
                    { label: "Vitamin D", value: labMetrics?.vitamin_d },
                    { label: "TSH", value: labMetrics?.tsh },
                    { label: "Fasting glucose", value: labMetrics?.fasting_glucose },
                    { label: "Uric acid", value: labMetrics?.uric_acid },
                    { label: "Creatinine", value: labMetrics?.creatinine },
                    {
                      label: "Blood pressure",
                      value:
                        labMetrics?.systolic_bp || labMetrics?.diastolic_bp
                          ? `${labMetrics?.systolic_bp ?? "n/a"}/${labMetrics?.diastolic_bp ?? "n/a"}`
                          : null
                    }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate/10 bg-white/80 px-4 py-3">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate">{item.value ?? "n/a"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <MoodTrendChart data={moodLogs.map((item) => ({ logged_at: item.logged_at ?? new Date().toISOString(), mood_score: item.mood_score }))} />
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

