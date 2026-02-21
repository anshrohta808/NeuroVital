# NeuroVital - Unified Health Intelligence Platform

A production-ready hackathon web app with two isolated AI engines:

1. **Medical Insight Engine** - structured, risk-based JSON output
2. **Mental Health Companion Engine** - conversational, reflective JSON output

Built with **Next.js App Router**, **Supabase**, **pgvector**, and **Gemini**.

## Features
- Supabase Auth (email/password)
- Structured vitals + family history intake
- PDF lab report extraction (Hemoglobin, Cholesterol, Vitamin D, TSH, Fasting Glucose)
- Medical risk insights with rule-based pre-tags
- Mental wellness companion with longitudinal mood tracking
- RAG retrieval from pgvector embeddings for medical engine only
- Professional dashboard UI

## Project structure
- `src/app` - App Router pages + API routes
- `src/services` - AI engines + embeddings + PDF extraction
- `src/lib` - Supabase clients, validation, utilities
- `sql/schema.sql` - Database schema and RLS policies

## Setup
1. Install dependencies
   ```bash
   npm install
   ```

2. Create Supabase project, then run the schema in `sql/schema.sql`.

3. Copy env template and fill in values:
   ```bash
   cp .env.example .env.local
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_EMBEDDING_DIM` (defaults to 1536; must match `embeddings.embedding` vector size)

## Database schema
Run `sql/schema.sql` inside Supabase SQL Editor. It creates tables:
- `vitals`
- `family_history`
- `lab_reports`
- `mood_logs`
- `mental_chat`
- `embeddings` (pgvector)

Row Level Security is enabled on every table with user-scoped policies.

## Deployment (Vercel)
1. Push repo to GitHub.
2. Create a new Vercel project from the repo.
3. Add env vars from `.env.local` to Vercel project settings.
4. Set build command: `npm run build` and output: `.next` (default).
5. Deploy.

## Notes
- Medical engine is deterministic and returns strict JSON.
- Mental engine stores conversation history in `mental_chat` and uses mood logs only.
- Embeddings are produced by Gemini; keep `GEMINI_EMBEDDING_DIM` aligned with the SQL schema.
