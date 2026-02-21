import type { FamilyHistoryInput, LabReportMetrics, VitalsInput } from "@/lib/types";

export type RiskTag = {
  label: string;
  reason: string;
};

export const computeBMI = (heightCm: number, weightKg: number) => {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

export const computeRiskTags = (
  vitals: VitalsInput | null,
  family: FamilyHistoryInput | null,
  labs: LabReportMetrics | null
): RiskTag[] => {
  const tags: RiskTag[] = [];
  if (!vitals) return tags;

  const bmi = computeBMI(vitals.height_cm, vitals.weight_kg);

  if (bmi && bmi > 25 && family?.has_diabetes) {
    tags.push({
      label: "elevated metabolic risk",
      reason: "BMI is above 25 with a family history of diabetes."
    });
  }

  const cholesterol = labs?.cholesterol ?? null;
  if (cholesterol !== null && cholesterol > 200) {
    tags.push({
      label: "lipid risk flag",
      reason: "Total cholesterol is above 200 mg/dL."
    });
  }

  const vitaminD = labs?.vitamin_d ?? null;
  if (vitaminD !== null && vitaminD < 20) {
    tags.push({
      label: "deficiency flag",
      reason: "Vitamin D is below 20 ng/mL."
    });
  }

  return tags;
};
