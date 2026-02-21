import pdfParse from "pdf-parse";
import { generateJson } from "@/services/aiClient";
import { safeJsonParse } from "@/lib/json";
import { labExtractionSchema } from "@/lib/validation";

const EMPTY_METRICS = {
  hemoglobin: null,
  cholesterol: null,
  vitamin_d: null,
  tsh: null,
  fasting_glucose: null,
  uric_acid: null,
  creatinine: null,
  systolic_bp: null,
  diastolic_bp: null
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxLength = 12000) =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

const firstNumber = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/(-?\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const extractWithRegex = (text: string) => {
  const lower = text.toLowerCase();
  const find = (pattern: RegExp) => {
    const match = lower.match(pattern);
    if (!match) return null;
    return firstNumber(match[0]);
  };

  return {
    hemoglobin: find(/(hemoglobin|hgb)[^0-9\-]*-?\d+(\.\d+)?/),
    cholesterol: find(/(cholesterol|total cholesterol)[^0-9\-]*-?\d+(\.\d+)?/),
    vitamin_d: find(/(vitamin\s*d|25-oh vitamin d|25-oh)[^0-9\-]*-?\d+(\.\d+)?/),
    tsh: find(/(tsh|thyroid stimulating hormone)[^0-9\-]*-?\d+(\.\d+)?/),
    fasting_glucose: find(/(fasting glucose|glucose, fasting|fasting)[^0-9\-]*-?\d+(\.\d+)?/),
    uric_acid: find(/(uric[\s,\-]*acid)([\s,\-]*(serum|uricase))?[^0-9\-]*-?\d+(\.\d+)?/),
    creatinine: find(/(creatinine)([\s,\-]*(serum|serum,modified|jaffe|jaf?fe|modified jaffes))?[^0-9\-]*-?\d+(\.\d+)?/),
    systolic_bp: find(/(systolic bp|systolic blood pressure)[^0-9\-]*-?\d+(\.\d+)?/),
    diastolic_bp: find(/(diastolic bp|diastolic blood pressure)[^0-9\-]*-?\d+(\.\d+)?/)
  };
};

export const extractLabMetrics = async (buffer: Buffer) => {
  let text = "";
  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text || "";
  } catch (error) {
    console.warn("PDF parse failed:", error);
    return { metrics: EMPTY_METRICS, rawText: "" };
  }

  const systemPrompt = `You are a medical lab extraction engine.\nExtract only these fields from the provided lab report text: Hemoglobin, Cholesterol, Vitamin D, TSH, Fasting Glucose, Uric Acid, Creatinine, Systolic BP, Diastolic BP.\nIf a value is missing, set it to null.\nReturn STRICT JSON with numeric values only.`;

  const cleanedText = cleanText(text);
  const truncatedText = truncateText(cleanedText);
  const regexMetrics = extractWithRegex(cleanedText);

  let metrics = { ...EMPTY_METRICS, ...regexMetrics };

  if (truncatedText) {
    try {
      const userPrompt = `Lab report text:\n${truncatedText}\n\nReturn JSON format:\n{\n  "hemoglobin": null,\n  "cholesterol": null,\n  "vitamin_d": null,\n  "tsh": null,\n  "fasting_glucose": null,\n  "uric_acid": null,\n  "creatinine": null,\n  "systolic_bp": null,\n  "diastolic_bp": null\n}`;

      const responseText = await generateJson({
        systemPrompt,
        userPrompt,
        temperature: 0
      });

      const json = safeJsonParse(responseText);
      const aiMetrics = labExtractionSchema.parse(json);

      metrics = {
        hemoglobin: typeof aiMetrics.hemoglobin === "number" ? aiMetrics.hemoglobin : metrics.hemoglobin,
        cholesterol: typeof aiMetrics.cholesterol === "number" ? aiMetrics.cholesterol : metrics.cholesterol,
        vitamin_d: typeof aiMetrics.vitamin_d === "number" ? aiMetrics.vitamin_d : metrics.vitamin_d,
        tsh: typeof aiMetrics.tsh === "number" ? aiMetrics.tsh : metrics.tsh,
        fasting_glucose:
          typeof aiMetrics.fasting_glucose === "number" ? aiMetrics.fasting_glucose : metrics.fasting_glucose,
        uric_acid: typeof aiMetrics.uric_acid === "number" ? aiMetrics.uric_acid : metrics.uric_acid,
        creatinine: typeof aiMetrics.creatinine === "number" ? aiMetrics.creatinine : metrics.creatinine,
        systolic_bp: typeof aiMetrics.systolic_bp === "number" ? aiMetrics.systolic_bp : metrics.systolic_bp,
        diastolic_bp: typeof aiMetrics.diastolic_bp === "number" ? aiMetrics.diastolic_bp : metrics.diastolic_bp
      };
    } catch (error) {
      console.warn("AI lab extraction failed. Returning regex fallback.", error);
    }
  }

  return { metrics, rawText: text };
};
