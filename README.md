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

## Deploy from GitHub

GitHub Pages is not a safe fit for this app because it only hosts static files and would expose the API key. Deploy the GitHub repo to a Node-capable host such as Render, Railway, Fly.io, or Vercel with a server runtime.

Set these environment variables in the hosting provider, not in GitHub code:

```bash
OPENAI_API_KEY=your_rotated_key
OPENAI_MODEL=gpt-5-nano
```

## Security note

If an API key has been pasted into chat, commit history, an issue, or any other shared place, rotate it in the OpenAI dashboard before deploying.
