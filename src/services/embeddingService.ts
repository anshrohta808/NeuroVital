import type { SupabaseClient } from "@supabase/supabase-js";
import type { FamilyHistoryInput, LabReportMetrics, VitalsInput } from "@/lib/types";
import { generateEmbedding } from "@/services/aiClient";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

export const buildVitalsSummary = (vitals: VitalsInput) => {
  return `Vitals - Height: ${vitals.height_cm} cm, Weight: ${vitals.weight_kg} kg.`;
};

export const buildFamilyHistorySummary = (family: FamilyHistoryInput) => {
  return `Family history - Diabetes: ${family.has_diabetes ? "yes" : "no"}, Heart disease: ${family.has_heart_disease ? "yes" : "no"}, Hypertension: ${family.has_hypertension ? "yes" : "no"}, Cancer: ${family.has_cancer ? "yes" : "no"}, Notes: ${family.notes ?? "none"}.`;
};

export const buildLabSummary = (labs: LabReportMetrics) => {
  return `Lab report - Hemoglobin: ${labs.hemoglobin ?? "n/a"}, Cholesterol: ${labs.cholesterol ?? "n/a"}, Vitamin D: ${labs.vitamin_d ?? "n/a"}, TSH: ${labs.tsh ?? "n/a"}, Fasting glucose: ${labs.fasting_glucose ?? "n/a"}, Uric acid: ${labs.uric_acid ?? "n/a"}, Creatinine: ${labs.creatinine ?? "n/a"}, Blood pressure: ${labs.systolic_bp ?? "n/a"}/${labs.diastolic_bp ?? "n/a"}.`;
};

export const storeEmbedding = async ({
  supabase,
  userId,
  sourceTable,
  sourceId,
  content
}: {
  supabase: SupabaseClient;
  userId: string;
  sourceTable: string;
  sourceId: string;
  content: string;
}) => {
  if (!content?.trim()) {
    return;
  }

  try {
    const embedding = await generateEmbedding(content, { taskType: "RETRIEVAL_DOCUMENT" });

    const { error } = await supabase.from("embeddings").insert({
      user_id: userId,
      source_table: sourceTable,
      source_id: sourceId,
      content,
      embedding
    });

    if (error) {
      console.warn("Embedding insert failed:", error.message);
    }
  } catch (error) {
    console.warn("Embedding generation failed:", error);
  }
};

export const fetchRelevantEmbeddings = async ({
  supabase,
  userId,
  query,
  matchCount = 5
}: {
  supabase: SupabaseClient;
  userId: string;
  query: string;
  matchCount?: number;
}) => {
  try {
    const embedding = await generateEmbedding(query, { taskType: "RETRIEVAL_QUERY" });

    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: embedding,
      match_count: matchCount,
      user_id: userId
    });

    if (error) {
      console.warn("Embedding match failed:", error.message);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.warn("Embedding retrieval failed:", error);
    return [];
  }
};
