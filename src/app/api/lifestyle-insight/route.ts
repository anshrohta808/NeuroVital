import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runLifestyleInsightEngine } from "@/services/lifestyleEngine";
import type { LifestyleInsightResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buildFallbackInsight = (): LifestyleInsightResponse => ({
  lifestyle_score: 70,
  life_expectancy_years: 78,
  summary:
    "Based on the limited lifestyle notes available, your habits appear mixed. Add more detail for a personalized assessment.",
  good_habits: ["Some healthy patterns are present."],
  improvement_areas: ["More information is needed to provide specific improvements."],
  ai_suggestions: ["Add details about sleep, movement, nutrition, and stress levels."],
  health_tips: ["Aim for daily movement and consistent sleep."],
  disclaimer: "This is a lifestyle reflection, not medical advice."
});

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: familyData } = await supabase
      .from("family_history")
      .select("notes")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const notes = familyData?.[0]?.notes?.trim();
    if (!notes) {
      return NextResponse.json({ data: buildFallbackInsight() });
    }

    try {
      const insight = await runLifestyleInsightEngine({ notes });
      return NextResponse.json({ data: insight });
    } catch (error) {
      console.warn("Lifestyle insight generation failed. Returning fallback.", error);
      return NextResponse.json({ data: buildFallbackInsight() });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
