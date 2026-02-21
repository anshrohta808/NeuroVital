import type { MedFactChatResponse } from "@/lib/types";
import { medFactResponseSchema } from "@/lib/validation";
import { safeJsonParse } from "@/lib/json";
import { generateJson } from "@/services/aiClient";

export const runMedFactEngine = async ({
  question
}: {
  question: string;
}): Promise<MedFactChatResponse> => {
  const systemPrompt =
    "You are an intelligent medical myth buster who debunks health misinformation with scientific temperament in easy language. " +
    "Be clear, kind, and concise. " +
    "Avoid diagnosing conditions. " +
    "Avoid prescribing medications or dosages. " +
    "If evidence is mixed, say so. " +
    "Explain why the myth is misleading and what the evidence-supported view is. " +
    "Provide 2-4 key points. " +
    "Return STRICT JSON matching the schema.\n\n" +
    "Required JSON schema:\n" +
    '{\n  "response": "",\n  "key_points": [],\n  "disclaimer": "This information is educational and not medical advice."\n}';

  const userPrompt = `Question or claim:\n${question}\n\nReturn ONLY the JSON object.`;

  const responseText = await generateJson({
    systemPrompt,
    userPrompt,
    temperature: 0.2
  });

  try {
    const parsed = safeJsonParse<MedFactChatResponse>(responseText);
    return medFactResponseSchema.parse(parsed);
  } catch {
    const repairPrompt = `Fix this into STRICT JSON matching the required schema. Return ONLY the JSON object, no markdown.\n\n${responseText}`;
    const repaired = await generateJson({
      systemPrompt: "You are a strict JSON repair tool.",
      userPrompt: repairPrompt,
      temperature: 0
    });
    const parsed = safeJsonParse<MedFactChatResponse>(repaired);
    return medFactResponseSchema.parse(parsed);
  }
};
