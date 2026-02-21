import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mentalChatSchema } from "@/lib/validation";
import type { MoodLogInput } from "@/lib/types";
import { runMentalHealthEngine } from "@/services/mentalHealthEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = mentalChatSchema.parse(await request.json());

    const { data: moodLogs } = await supabase
      .from("mood_logs")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("logged_at", { ascending: false })
      .limit(14);

    const { data: chatHistory } = await supabase
      .from("mental_chat")
      .select("role, content, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    const history = (chatHistory ?? []).map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content
    }));

    const response = await runMentalHealthEngine({
      moodLogs: (moodLogs as MoodLogInput[]) ?? [],
      conversationHistory: history,
      userMessage: payload.message
    });

    const assistantContent = `Summary: ${response.summary}\nPattern: ${response.pattern_observed}\nGuidance: ${response.supportive_guidance}\nReflection: ${response.reflection_prompt}`;

    await supabase.from("mental_chat").insert([
      { user_id: userData.user.id, role: "user", content: payload.message },
      { user_id: userData.user.id, role: "assistant", content: assistantContent }
    ]);

    return NextResponse.json({ data: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

