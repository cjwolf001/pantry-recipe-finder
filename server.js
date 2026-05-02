import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const app = express();
const port = process.env.PORT || 3000;
const model = process.env.OPENAI_MODEL || "gpt-5-nano";

const requestSchema = z.object({
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

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.post("/api/recipes", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Tell me what ingredients you have first." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured on the server.",
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.responses.create({
      model,
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
          content: `The user described their available ingredients like this:\n${parsed.data.pantryText}\n\nDietary notes or preferences: ${
            parsed.data.dietaryNotes || "none"
          }\n\nInfer ingredients and quantities from the casual text when possible. Return recipes the user can reasonably make now.`,
        },
      ],
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned no recipe JSON.");
    }

    const payload = JSON.parse(response.output_text);
    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Recipe generation failed. Check the server logs and API key.",
    });
  }
});

app.listen(port, () => {
  console.log(`Pantry Recipe Finder running at http://localhost:${port}`);
});
