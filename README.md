# Pantry Recipe Finder

A small full-stack recipe website where you describe the ingredients you have in casual text, then get recipe ideas you can expand for exact cooking instructions.

## Why there is a server

The OpenAI API key must never be placed in browser JavaScript or committed to GitHub. This app keeps the key in `OPENAI_API_KEY` on the Node server and exposes only `/api/recipes` to the browser.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

Edit `.env` and set `OPENAI_API_KEY` to your current key. The default model is `gpt-5-nano`, OpenAI's fastest and most cost-efficient GPT-5 model listed in the model docs.

Open <http://localhost:3000>.

## Static build

```bash
npm run build
```

The build copies the frontend from `public/` into `dist/`, which is the output directory Vercel serves.

## Deploy to Vercel Hobby

GitHub Pages is not a safe fit for this app because it only hosts static files and would expose the API key. Vercel Hobby works because `/api/recipes` runs as a serverless function and reads the key from Vercel environment variables.

1. Import this GitHub repo into Vercel.
2. In Project Settings, set Framework Preset to `Other`.
3. In Project Settings, set Node.js Version to `20.x` or newer.
4. Add these environment variables in Vercel, not in GitHub code:

```bash
OPENAI_API_KEY=your_rotated_key
OPENAI_MODEL=gpt-5-nano
```

5. Deploy. The frontend in `public/` will call the Vercel serverless function at `/api/recipes`.

## Security note

If an API key has been pasted into chat, commit history, an issue, or any other shared place, rotate it in the OpenAI dashboard before deploying.
