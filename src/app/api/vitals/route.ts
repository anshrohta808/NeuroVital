import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { vitalsSchema } from "@/lib/validation";
import { buildVitalsSummary, storeEmbedding } from "@/services/embeddingService";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = vitalsSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("vitals")
      .insert({ user_id: userData.user.id, ...payload })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
    }

    const summary = buildVitalsSummary(payload);
    await storeEmbedding({
      supabase,
      userId: userData.user.id,
      sourceTable: "vitals",
      sourceId: data.id,
      content: summary
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

