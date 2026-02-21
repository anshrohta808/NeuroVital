import type { MedicalInsightResponse, FamilyHistoryInput, LabReportMetrics, VitalsInput } from "@/lib/types";
import { medicalInsightSchema } from "@/lib/validation";
import { safeJsonParse } from "@/lib/json";
import type { RiskTag } from "@/lib/riskRules";
import { generateJson } from "@/services/aiClient";

export const runMedicalInsightEngine = async ({
  vitals,
  familyHistory,
  labMetrics,
  embeddingSnippets,
  riskTags
}: {
  vitals: VitalsInput | null;
  familyHistory: FamilyHistoryInput | null;
  labMetrics: LabReportMetrics | null;
  embeddingSnippets: string[];
  riskTags: RiskTag[];
}): Promise<MedicalInsightResponse> => {
  const systemPrompt = `You are the Medical Insight Engine for NeuroVital.\n\nRules:\n- Provide preventive, risk-based insights only.\n- Do NOT diagnose conditions.\n- Do NOT prescribe medications or dosages.\n- Do NOT claim certainty.\n- Output must be STRICT JSON matching the schema.\n\nRequired JSON schema:\n{\n  "risk_summary": "",\n  "current_red_flags": [],\n  "preventive_actions": [],\n  "lifestyle_improvements": [],\n  "consult_doctor_if": [],\n  "disclaimer": "This system provides preventive insights and is not a medical diagnosis tool."\n}`;

  const userPrompt = `Context data (JSON):\n${JSON.stringify(
    {
      vitals,
      family_history: familyHistory,
      lab_metrics: labMetrics,
      rule_based_risk_tags: riskTags,
      relevant_notes: embeddingSnippets
    },
    null,
    2
  )}\n\nReturn ONLY the JSON object. Be concise and dashboard-ready.`;

  const responseText = await generateJson({
    systemPrompt,
    userPrompt,
    temperature: 0.1
  });

  try {
    const parsed = safeJsonParse<MedicalInsightResponse>(responseText);
    return medicalInsightSchema.parse(parsed);
  } catch {
    const repairPrompt = `Fix this into STRICT JSON matching the required schema. Return ONLY the JSON object, no markdown.\n\n${responseText}`;
    const repaired = await generateJson({
      systemPrompt: "You are a strict JSON repair tool.",
      userPrompt: repairPrompt,
      temperature: 0
    });
    const parsed = safeJsonParse<MedicalInsightResponse>(repaired);
    return medicalInsightSchema.parse(parsed);
  }
};
