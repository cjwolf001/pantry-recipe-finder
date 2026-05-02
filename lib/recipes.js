import OpenAI from "openai";
import { z } from "zod";

export const requestSchema = z.object({
  pantryText: z.string().trim().min(3).max(2000),
  dietaryNotes: z.string().trim().max(300).optional().default(""),
});

const recipeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recipes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          matchScore: { type: "integer", minimum: 1, maximum: 100 },
          timeMinutes: { type: "integer", minimum: 5, maximum: 240 },
          servings: { type: "integer", minimum: 1, maximum: 12 },
          uses: { type: "array", items: { type: "string" } },
          missingBasics: { type: "array", items: { type: "string" } },
          instructions: { type: "array", minItems: 3, maxItems: 9, items: { type: "string" } },
        },
        required: [
          "title",
          "summary",
          "matchScore",
          "timeMinutes",
          "servings",
          "uses",
          "missingBasics",
          "instructions",
        ],
      },
    },
  },
  required: ["recipes"],
};

export async function generateRecipes({ pantryText, dietaryNotes }) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured on the server.");
    error.statusCode = 500;
    throw error;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-nano",
    max_output_tokens: 2200,
    reasoning: { effort: "minimal" },
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "recipe_results",
        schema: recipeSchema,
        strict: true,
      },
    },
    input: [
      {
        role: "system",
        content:
          "You are a practical home cook. Suggest recipes that maximize the listed ingredients. Pantry basics such as salt, pepper, oil, water, sugar, and common spices may be assumed, but list any other missing basics. Keep wording concise and instructions specific.",
      },
      {
        role: "user",
        content: `The user described their available ingredients like this:\n${pantryText}\n\nDietary notes or preferences: ${
          dietaryNotes || "none"
        }\n\nInfer ingredients and quantities from the casual text when possible. Return recipes the user can reasonably make now.`,
      },
    ],
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned no recipe JSON.");
  }

  return JSON.parse(response.output_text);
}
