import "dotenv/config";
import { generateRecipes, requestSchema } from "../lib/recipes.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const parsed = requestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Tell me what ingredients you have first." });
  }

  try {
    const payload = await generateRecipes(parsed.data);
    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      error:
        error.statusCode === 500
          ? error.message
          : "Recipe generation failed. Check the server logs and API key.",
    });
  }
}
