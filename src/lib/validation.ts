import { z } from "zod";

export const vitalsSchema = z.object({
  height_cm: z.number().min(50).max(250),
  weight_kg: z.number().min(20).max(300)
});

export const familyHistorySchema = z.object({
  has_diabetes: z.boolean(),
  has_heart_disease: z.boolean(),
  has_hypertension: z.boolean(),
  has_cancer: z.boolean(),
  notes: z.string().max(1000).nullable()
});

export const moodLogSchema = z.object({
  mood_score: z.number().min(1).max(10),
  energy_score: z.number().min(1).max(10),
  stress_score: z.number().min(1).max(10),
  notes: z.string().max(1000).nullable().optional()
});

export const mentalChatSchema = z.object({
  message: z.string().min(1).max(2000)
});

export const medicalInsightSchema = z.object({
  risk_summary: z.string(),
  current_red_flags: z.array(z.string()),
  preventive_actions: z.array(z.string()),
  lifestyle_improvements: z.array(z.string()),
  consult_doctor_if: z.array(z.string()),
  disclaimer: z.string()
});

export const mentalChatResponseSchema = z.object({
  summary: z.string(),
  pattern_observed: z.string(),
  supportive_guidance: z.string(),
  reflection_prompt: z.string()
});

export const labExtractionSchema = z.object({
  hemoglobin: z.number().nullable(),
  cholesterol: z.number().nullable(),
  vitamin_d: z.number().nullable(),
  tsh: z.number().nullable(),
  fasting_glucose: z.number().nullable(),
  uric_acid: z.number().nullable(),
  creatinine: z.number().nullable(),
  systolic_bp: z.number().nullable(),
  diastolic_bp: z.number().nullable()
});

export const lifestyleInsightSchema = z.object({
  lifestyle_score: z.number().min(0).max(100),
  life_expectancy_years: z.number().min(30).max(120),
  summary: z.string(),
  good_habits: z.array(z.string()).min(1),
  improvement_areas: z.array(z.string()).min(1),
  ai_suggestions: z.array(z.string()).min(2),
  health_tips: z.array(z.string()).min(2),
  disclaimer: z.string()
});

export const medFactResponseSchema = z.object({
  response: z.string(),
  key_points: z.array(z.string()).min(1),
  disclaimer: z.string()
});
