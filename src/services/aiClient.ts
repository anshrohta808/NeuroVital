import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================
   Gemini Client
========================= */

const getProvider = () => (process.env.AI_PROVIDER || "gemini").toLowerCase();

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  return new GoogleGenerativeAI(apiKey);
};

const isGeminiModelFallbackCandidate = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /model|not found|invalid|404|not_found|invalid_argument/i.test(message);
};

const generateWithGeminiRest = async ({
  systemPrompt,
  userPrompt,
  temperature,
  modelOverride
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  modelOverride?: string;
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const configuredModel = modelOverride || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const fallbackModels = ["gemini-1.5-flash", "gemini-1.5-pro"];
  const modelsToTry = [configuredModel, ...fallbackModels].filter(
    (model, index, list) => list.indexOf(model) === index
  );

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const basePayload = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    } as const;

    const tryRequest = async (withJsonResponse: boolean) => {
      const payload = {
        ...basePayload,
        generationConfig: withJsonResponse
          ? { temperature, responseMimeType: "application/json" }
          : { temperature }
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        const message = data?.error?.message || "Gemini request failed.";
        throw new Error(message);
      }

      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((part: { text?: string }) => part.text ?? "").join("");
      if (!text.trim()) {
        throw new Error("Gemini response was empty.");
      }
      return text;
    };

    try {
      return await tryRequest(true);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (/responsemimetype|mime|invalid_argument/i.test(message)) {
        try {
          return await tryRequest(false);
        } catch (retryError) {
          lastError = retryError;
        }
      }

      if (!isGeminiModelFallbackCandidate(error)) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

const generateWithGeminiSdk = async ({
  systemPrompt,
  userPrompt,
  temperature,
  modelOverride
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  modelOverride?: string;
}) => {
  const genAI = getGeminiClient();

  const configuredModel = modelOverride || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const fallbackModels = ["gemini-1.5-flash", "gemini-1.5-pro"];
  const modelsToTry = [configuredModel, ...fallbackModels].filter(
    (model, index, list) => list.indexOf(model) === index
  );

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature }
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      if (!isGeminiModelFallbackCandidate(error)) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

const generateWithOpenAI = async ({
  systemPrompt,
  userPrompt,
  temperature,
  modelOverride
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  modelOverride?: string;
}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment variables.");
  }

  const model = modelOverride || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.error?.message || "OpenAI request failed.";
    throw new Error(detail);
  }

  return payload?.choices?.[0]?.message?.content ?? "";
};

/* =========================
   JSON Generation
========================= */

export const generateJson = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  modelOverride,
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  modelOverride?: string;
}) => {
  const provider = getProvider();

  if (provider === "openai") {
    return generateWithOpenAI({ systemPrompt, userPrompt, temperature, modelOverride });
  }

  if (provider === "gemini") {
    try {
      return await generateWithGeminiSdk({ systemPrompt, userPrompt, temperature, modelOverride });
    } catch (error) {
      try {
        return await generateWithGeminiRest({ systemPrompt, userPrompt, temperature, modelOverride });
      } catch (restError) {
        if (process.env.OPENAI_API_KEY) {
          return generateWithOpenAI({ systemPrompt, userPrompt, temperature, modelOverride });
        }
        throw restError;
      }
    }
  }

  try {
    return await generateWithGeminiSdk({ systemPrompt, userPrompt, temperature, modelOverride });
  } catch (error) {
    try {
      return await generateWithGeminiRest({ systemPrompt, userPrompt, temperature, modelOverride });
    } catch (restError) {
      if (process.env.OPENAI_API_KEY) {
        return generateWithOpenAI({ systemPrompt, userPrompt, temperature, modelOverride });
      }
      throw restError;
    }
  }
};

/* =========================
   Embeddings
========================= */

type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

export const generateEmbedding = async (
  input: string,
  options?: {
    taskType?: EmbeddingTaskType;
    title?: string;
    modelOverride?: string;
  }
) => {
  const genAI = getGeminiClient();

  const modelName =
    options?.modelOverride ||
    process.env.GEMINI_EMBEDDING_MODEL ||
    "embedding-001";

  const model = genAI.getGenerativeModel({
    model: modelName
  });

  const request =
    options?.taskType || options?.title
      ? {
          content: {
            role: "user",
            parts: [{ text: input }]
          },
          taskType: options?.taskType,
          title: options?.title
        }
      : input;

  const result = await model.embedContent(request);

  return result.embedding.values;
};
