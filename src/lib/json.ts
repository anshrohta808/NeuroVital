export const safeJsonParse = <T>(input: string): T => {
  try {
    return JSON.parse(input) as T;
  } catch {
    const match = input.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in model response.");
    }
    return JSON.parse(match[0]) as T;
  }
};
