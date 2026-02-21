import type { LifestyleInsightResponse } from "@/lib/types";
import { lifestyleInsightSchema } from "@/lib/validation";
import { safeJsonParse } from "@/lib/json";
import { generateJson } from "@/services/aiClient";

export const runLifestyleInsightEngine = async ({
  notes
}: {
  notes: string;
}): Promise<LifestyleInsightResponse> => {
  const systemPrompt = `You are a medical health and lifestyle expert.\nYour job is to analyze a user's day-to-day habits and summarize lifestyle impact.\nRules:\n- Use only the provided lifestyle notes.\n- Do not diagnose disease.\n- Do not provide medication or dosages.\n- Provide balanced, supportive language.\n- Estimate life expectancy in YEARS as a broad, non-medical, motivational estimate.\n- Output STRICT JSON matching the schema.\n\nRequired JSON schema:\n{\n  "lifestyle_score": 0-100,\n  "life_expectancy_years": 30-120,\n  "summary": "",\n  "good_habits": [],\n  "improvement_areas": [],\n  "ai_suggestions": [],\n  "health_tips": [],\n  "disclaimer": "This is a lifestyle reflection, not medical advice."\n}`;

  const userPrompt = `Lifestyle notes from the user:\n${notes}\n\nReturn ONLY the JSON object.`;

  const responseText = await generateJson({
    systemPrompt,
    userPrompt,
    temperature: 0.3
  });

  try {
    const parsed = safeJsonParse<LifestyleInsightResponse>(responseText);
    return lifestyleInsightSchema.parse(parsed);
  } catch {
    const repairPrompt = `Fix this into STRICT JSON matching the required schema. Return ONLY the JSON object, no markdown.\n\n${responseText}`;
    const repaired = await generateJson({
      systemPrompt: "You are a strict JSON repair tool.",
      userPrompt: repairPrompt,
      temperature: 0
    });
    const parsed = safeJsonParse<LifestyleInsightResponse>(repaired);
    return lifestyleInsightSchema.parse(parsed);
  }
};
