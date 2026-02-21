import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeRiskTags } from "@/lib/riskRules";
import type { FamilyHistoryInput, LabReportMetrics, MedicalInsightResponse, VitalsInput } from "@/lib/types";
import { fetchRelevantEmbeddings } from "@/services/embeddingService";
import { runMedicalInsightEngine } from "@/services/medicalEngine";
import type { RiskTag } from "@/lib/riskRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buildFallbackInsight = ({
  riskTags
}: {
  riskTags: RiskTag[];
}): MedicalInsightResponse => {
  const redFlags =
    riskTags.length > 0
      ? riskTags.map((tag) => `${tag.label}: ${tag.reason}`)
      : ["No rule-based alerts yet."];

  const riskSummary =
    riskTags.length > 0
      ? `Rule-based review identified ${riskTags.length} preventive ${riskTags.length === 1 ? "flag" : "flags"} to monitor.`
      : "Rule-based review did not detect any preventive risk flags in the latest snapshot.";

  const flaggedLabels = riskTags.map((tag) => tag.label).join(", ");
  const preventiveActions = [
    "Review your latest vitals and labs with a clinician during your next visit.",
    "Keep monitoring key markers and update this dashboard as new data arrives.",
    "Prioritize sleep, movement, and balanced nutrition to support long-term health."
  ];

  if (flaggedLabels) {
    preventiveActions.unshift(`Plan a preventive check-in to review: ${flaggedLabels}.`);
  }

  const lifestyleImprovements = [
    "Aim for consistent sleep and daily movement that fits your routine.",
    "Keep hydration and meal timing steady to support energy and glucose stability.",
    "Use stress-reduction habits (walks, breathing, reflection) to maintain balance."
  ];

  const consultDoctorIf =
    riskTags.length > 0
      ? riskTags.map((tag) => `You have concerns related to ${tag.label.toLowerCase()} or symptoms that persist.`)
      : ["You notice new or worsening symptoms, or have questions about your results."];

  return {
    risk_summary: riskSummary,
    current_red_flags: redFlags,
    preventive_actions: preventiveActions,
    lifestyle_improvements: lifestyleImprovements,
    consult_doctor_if: consultDoctorIf,
    disclaimer: "This system provides preventive insights and is not a medical diagnosis tool."
  };
};

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: vitalsData } = await supabase
      .from("vitals")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: familyData } = await supabase
      .from("family_history")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: labData } = await supabase
      .from("lab_reports")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const vitals = (vitalsData?.[0] as VitalsInput) ?? null;
    const familyHistory = (familyData?.[0] as FamilyHistoryInput) ?? null;
    const labMetrics = (labData?.[0] as LabReportMetrics) ?? null;

    const riskTags = computeRiskTags(vitals, familyHistory, labMetrics);

    const embeddingMatches = await fetchRelevantEmbeddings({
      supabase,
      userId: userData.user.id,
      query: "Preventive medical risk insight from recent vitals, labs, and family history",
      matchCount: 5
    });

    const embeddingSnippets = embeddingMatches.map((item: { content: string }) => item.content);

    let insight: MedicalInsightResponse;

    try {
      insight = await runMedicalInsightEngine({
        vitals,
        familyHistory,
        labMetrics,
        embeddingSnippets,
        riskTags
      });
    } catch (error) {
      console.warn("Medical insight generation failed. Returning fallback insight.", error);
      insight = buildFallbackInsight({ riskTags });
    }

    return NextResponse.json({ data: insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

