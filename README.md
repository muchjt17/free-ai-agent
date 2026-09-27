# Standalone Free AI Agent

A small ChatGPT-style AI agent built with:

- Cloudflare Pages + Pages Functions
- Supabase Postgres
- OpenRouter free-model routing
- Plain HTML/CSS/JavaScript
- Anonymous browser identity (no login required)

## Features

- Chat UI
- Persistent conversations
- Conversation list
- Persistent memory
- "Remember ..." memory command
- Server-side OpenRouter key
- Mobile responsive UI
- No frontend framework
- No npm dependencies required

## 1. Create Supabase database

Create a free Supabase project and open SQL Editor.

Run `supabase/schema.sql` in full.

The application stores conversations, messages and memories there.

## 2. Create an OpenRouter key

Create an OpenRouter API key.

The backend uses:

    openrouter/free

This selects an available free model. Free model availability and rate limits can change.

## 3. Create a Cloudflare Pages project

Push this folder to GitHub.

In Cloudflare:

Workers & Pages -> Create application -> Pages -> Import an existing Git repository

Framework preset: None

Build command: leave empty

Build output directory: `/`

Because `functions/` is at the project root, Cloudflare Pages will deploy the Pages Functions automatically.

## 4. Add Cloudflare secrets

In your Pages project:

Settings -> Variables and Secrets

Add these as encrypted secrets:

    OPENROUTER_API_KEY
    SUPABASE_URL
    SUPABASE_SECRET_KEY

`SUPABASE_URL` is your Supabase project URL.

`SUPABASE_SECRET_KEY` is the server-only secret key from Supabase's API Keys/Connect area.

Do NOT put either secret in `index.html`, `app.js`, GitHub, or other public files.

Optional:

    APP_URL=https://your-project.pages.dev
    APP_NAME=Free AI Agent

Then redeploy.

## 5. Test

Open your Pages URL.

Send:

    Hello

Then try:

    Remember that I prefer short answers.

Then start another chat and ask:

    What do you remember about me?

The backend includes saved memories in the AI context.

## Local development

You can use Cloudflare Wrangler if desired:

    npx wrangler pages dev .

For local secrets, create `.dev.vars`:

    OPENROUTER_API_KEY="..."
    SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
    SUPABASE_SECRET_KEY="..."
    APP_URL="http://localhost:8788"
    APP_NAME="Free AI Agent"

Do not commit `.dev.vars`.

## Important security note

This version does not have user accounts. It creates a random UUID in the browser and sends it to the backend.

That is suitable for a simple personal/learning prototype, but it is NOT strong multi-user authentication. Someone who obtains another user's UUID could potentially impersonate that browser identity.

For a public production application, add real authentication (for example Supabase Auth) and validate the authenticated user's identity server-side.

## Cost

The project itself does not require a paid server. It is designed around free tiers.

However, free-tier quotas and provider policies can change. OpenRouter's free models are capacity/rate limited and may sometimes be unavailable.

No payment/card information is intentionally required by this codebase.
