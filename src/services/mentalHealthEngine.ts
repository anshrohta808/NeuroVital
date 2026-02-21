import type { MentalChatResponse, MoodLogInput } from "@/lib/types";
import { mentalChatResponseSchema } from "@/lib/validation";
import { safeJsonParse } from "@/lib/json";
import { generateJson } from "@/services/aiClient";

export const runMentalHealthEngine = async ({
  moodLogs,
  conversationHistory,
  userMessage
}: {
  moodLogs: MoodLogInput[];
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}): Promise<MentalChatResponse> => {
  const systemPrompt = `You are a CBT-style mental wellness reflection assistant.\nYou do not diagnose.\nYou help users reflect on emotional patterns.\nYou ask gentle follow-up questions.\nYou provide coping suggestions such as journaling, breathing, structure, exercise.\n\nReturn STRICT JSON:\n{\n  "summary": "",\n  "pattern_observed": "",\n  "supportive_guidance": "",\n  "reflection_prompt": ""\n}`;

  const userPrompt = `Recent mood logs (last 7-14):\n${JSON.stringify(moodLogs, null, 2)}\n\nConversation history (latest first):\n${JSON.stringify(conversationHistory, null, 2)}\n\nUser message: ${userMessage}\n\nReturn ONLY the JSON object. Keep a warm, reflective tone.`;

  const responseText = await generateJson({
    systemPrompt,
    userPrompt,
    temperature: 0.4
  });

  try {
    const parsed = safeJsonParse<MentalChatResponse>(responseText);
    return mentalChatResponseSchema.parse(parsed);
  } catch {
    const repairPrompt = `Fix this into STRICT JSON matching the required schema. Return ONLY the JSON object, no markdown.\n\n${responseText}`;
    const repaired = await generateJson({
      systemPrompt: "You are a strict JSON repair tool.",
      userPrompt: repairPrompt,
      temperature: 0
    });
    const parsed = safeJsonParse<MentalChatResponse>(repaired);
    return mentalChatResponseSchema.parse(parsed);
  }
};
