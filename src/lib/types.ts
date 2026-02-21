export type VitalsInput = {
  height_cm: number;
  weight_kg: number;
};

export type FamilyHistoryInput = {
  has_diabetes: boolean;
  has_heart_disease: boolean;
  has_hypertension: boolean;
  has_cancer: boolean;
  notes: string | null;
};

export type LabReportMetrics = {
  hemoglobin: number | null;
  cholesterol: number | null;
  vitamin_d: number | null;
  tsh: number | null;
  fasting_glucose: number | null;
  uric_acid: number | null;
  creatinine: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
};

export type MoodLogInput = {
  mood_score: number;
  energy_score: number;
  stress_score: number;
  notes: string | null;
  logged_at?: string;
};

export type MedicalInsightResponse = {
  risk_summary: string;
  current_red_flags: string[];
  preventive_actions: string[];
  lifestyle_improvements: string[];
  consult_doctor_if: string[];
  disclaimer: string;
};

export type MentalChatResponse = {
  summary: string;
  pattern_observed: string;
  supportive_guidance: string;
  reflection_prompt: string;
};

export type LifestyleInsightResponse = {
  lifestyle_score: number;
  life_expectancy_years: number;
  summary: string;
  good_habits: string[];
  improvement_areas: string[];
  ai_suggestions: string[];
  health_tips: string[];
  disclaimer: string;
};

export type MedFactChatResponse = {
  response: string;
  key_points: string[];
  disclaimer: string;
};
