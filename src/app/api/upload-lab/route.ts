import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractLabMetrics } from "@/services/pdfExtraction";
import { buildLabSummary, storeEmbedding } from "@/services/embeddingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { metrics, rawText } = await extractLabMetrics(buffer);

    const { data, error } = await supabase
      .from("lab_reports")
      .insert({
        user_id: userData.user.id,
        report_name: file.name,
        raw_text: rawText,
        hemoglobin: metrics.hemoglobin,
        cholesterol: metrics.cholesterol,
        vitamin_d: metrics.vitamin_d,
        tsh: metrics.tsh,
        fasting_glucose: metrics.fasting_glucose,
        uric_acid: metrics.uric_acid,
        creatinine: metrics.creatinine,
        systolic_bp: metrics.systolic_bp,
        diastolic_bp: metrics.diastolic_bp
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
    }

    const summary = buildLabSummary(metrics);
    await storeEmbedding({
      supabase,
      userId: userData.user.id,
      sourceTable: "lab_reports",
      sourceId: data.id,
      content: summary
    });

    return NextResponse.json({ data, metrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

