import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const auditSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.NUMBER, description: "Percentage score 0-100" },
        totalChecks: { type: Type.NUMBER },
        passed: { type: Type.NUMBER },
        failed: { type: Type.NUMBER },
        warnings: { type: Type.NUMBER },
        timestamp: { type: Type.STRING },
      },
      required: ["overallScore", "totalChecks", "passed", "failed", "warnings", "timestamp"],
    },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING"] },
          score: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                expected: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING"] },
                message: { type: Type.STRING },
              },
              required: ["name", "value", "expected", "status", "message"],
            },
          },
        },
        required: ["id", "name", "status", "score", "items"],
      },
    },
  },
  required: ["summary", "categories"],
};

export const auditBimModel = async (modelData: string, standards: string): Promise<AuditReport> => {
  const prompt = `
    You are an expert BIM Manager and Auditor. 
    Your task is to audit the provided "Model Data" against the "Project Standards" (BEP - BIM Execution Plan).
    
    Focus specifically on these 4 categories:
    1. Levels (Elevations, Naming conventions)
    2. Grids (Naming, Spacing, Extents implied by data)
    3. Coordinates (Project Base Point, Survey Point, Rotation)
    4. Worksets (Naming conventions, Active status)

    Analyze every discrepancy. If specific standards aren't explicitly provided for a category, use industry best practices (ISO 19650) as the expected standard but mark it as a warning if it deviates from common sense.

    Model Data:
    ${modelData}

    Project Standards:
    ${standards}

    Return the result as a strictly structured JSON object adhering to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: auditSchema,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on this standard task
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }
    return JSON.parse(text) as AuditReport;
  } catch (error) {
    console.error("Audit failed:", error);
    throw error;
  }
};