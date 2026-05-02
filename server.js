import "dotenv/config";
import express from "express";
import { generateRecipes, requestSchema } from "./lib/recipes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.post("/api/recipes", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Tell me what ingredients you have first." });
  }

  try {
    const payload = await generateRecipes(parsed.data);
    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      error:
        error.statusCode === 500
          ? error.message
          : "Recipe generation failed. Check the server logs and API key.",
    });
  }
});

app.listen(port, () => {
  console.log(`Pantry Recipe Finder running at http://localhost:${port}`);
});
