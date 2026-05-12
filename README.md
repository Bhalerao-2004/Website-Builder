# ReelForge

AI co-writer for short-form video creators. Generate viral hooks, full scripts, scene-by-scene shot lists, captions, hashtags, and thumbnails — all from a single topic line.

Built with **Next.js 15** (App Router, full-stack), **Auth0** for auth, **MongoDB Atlas** for storage, and **Google Gemini** for both text and image generation. Designed to deploy on the Vercel free tier.

---

## Features

- **Auth0 login / signup** — middleware-mounted at `/auth/login`, `/auth/logout`, `/auth/callback`.
- **Multi-step AI generation** — hooks, scripts, hashtags, and thumbnails each have their own specialized prompt (not one mega-prompt). Steps 2 & 3 run in parallel.
- **Filmable scene breakdowns** — every scene includes a concrete visual description, the exact voiceover words, duration, and optional on-screen text.
- **Thumbnail generation** — separate API call so users can iterate without re-running text generation. Powered by `gemini-2.5-flash-image`.
- **Script management** — inline edit, autosave, duplicate, delete, organize into colored folders.
- **Dashboard** — search, folder filtering, thumbnail-first card layout.
- **Gemini key never leaves the server.** All generation goes through `/api/*` routes — the frontend never sees the API key.

## Architecture

```
app/
├── (app)/                    # authenticated routes (sidebar layout)
│   ├── dashboard/            # all scripts + folder views
│   ├── new/                  # generation wizard
│   └── scripts/[id]/         # editor + thumbnail panel
├── api/
│   ├── _helpers.ts           # withAuth wrapper, error mapping
│   ├── generate/             # POST: multi-step generation pipeline
│   ├── scripts/              # CRUD + duplicate + thumbnail
│   ├── folders/              # CRUD
│   └── me/                   # session profile
├── layout.tsx                # root, fonts, Auth0Provider, Toast
└── page.tsx                  # marketing landing

components/
├── AppShell.tsx              # sidebar (folders, user, nav)
├── ScriptCard.tsx            # dashboard card with overflow menu
├── ScriptEditor.tsx          # main editor + thumbnail sidebar
└── Toast.tsx                 # toast notifications

lib/
├── auth0.ts                  # Auth0Client + requireUser helper
├── gemini.ts                 # GoogleGenAI wrapper (JSON + image helpers)
├── prompts.ts                # 4 specialized prompts (hook / script / hashtag / thumbnail)
├── mongodb.ts                # cached MongoClient (dev-safe HMR)
├── repo.ts                   # collection accessors + indexes
├── types.ts                  # Script / Folder schemas + DTOs
└── utils.ts                  # cn(), date helpers

middleware.ts                 # mounts Auth0 /auth/* routes
```

### Data model (MongoDB)

```ts
scripts: {
  userId, folderId?, topic, niche, platform, contentStyle,
  title, hook, script, scenes[], cta, hashtags[], caption,
  thumbnail?: { mimeType, dataBase64, prompt, generatedAt },
  createdAt, updatedAt
}

folders: { userId, name, color, createdAt, updatedAt }
```

Indexes: `{userId, updatedAt}` and `{userId, folderId}` on `scripts`; `{userId, name}` on `folders`. Created lazily on first access.

### Generation pipeline

`POST /api/generate` runs as three Gemini calls, designed for both quality and latency:

1. **Hooks + title** (`gemini-2.5-flash`, JSON mode) — produces 3 hook angles and a title.
2. **Script + scenes + CTA** (parallel with step 3) — produces the full voiceover, scene breakdown, and CTA, conditioned on the chosen hook.
3. **Hashtags + caption** (parallel with step 2) — produces platform-tuned caption and hashtag mix.

Thumbnails are a **separate endpoint** (`POST /api/scripts/[id]/thumbnail`) so the user sees text instantly, then opts in to image generation (which is slower and pricier). Custom creative direction can be added per-regeneration. This effectively decouples image generation from the synchronous text path — the same role queues/jobs would play in a larger deployment.

### Why server-side only

The Gemini key lives in `process.env.GEMINI_API_KEY`, accessed only from `/api/*` route handlers. The frontend calls our own API and never sees Google. All auth-gated endpoints go through `withAuth()` which enforces an Auth0 session and maps domain errors (`AuthError`, `BadRequestError`, `NotFoundError`, `GeminiError`) to the right HTTP code.

---

## Local setup

### 1. Prereqs

- Node.js 20+ (built and tested on Node 22+)
- An Auth0 tenant (free)
- A MongoDB Atlas cluster (free M0)
- A Google AI Studio API key

### 2. Install

```bash
npm install
cp .env.example .env.local
```

### 3. Fill in `.env.local`

#### Auth0

1. Create a free tenant at https://auth0.com.
2. Create a **Regular Web Application**.
3. In the application settings:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
4. Copy your **Domain**, **Client ID**, **Client Secret** into `.env.local`.
5. Generate `AUTH0_SECRET` with `openssl rand -hex 32`.

```env
AUTH0_SECRET=<openssl rand -hex 32>
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

#### MongoDB Atlas

1. Create a free M0 cluster at https://www.mongodb.com/cloud/atlas.
2. Add a database user and whitelist `0.0.0.0/0` (or your IP).
3. Get the connection string ("Connect → Drivers → Node") and put it in `.env.local`.

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.xyz.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=reelforge
```

#### Gemini

Get a key at https://aistudio.google.com/apikey.

```env
GEMINI_API_KEY=...
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add **every variable from `.env.example`** in the Vercel project settings (Environment Variables → Production + Preview + Development).
4. Update `APP_BASE_URL` to your Vercel URL (e.g. `https://reelforge.vercel.app`).
5. In Auth0 application settings, add:
   - **Allowed Callback URLs**: `https://YOUR-DOMAIN.vercel.app/auth/callback`
   - **Allowed Logout URLs**: `https://YOUR-DOMAIN.vercel.app`
6. In MongoDB Atlas Network Access, allow `0.0.0.0/0` (Vercel uses dynamic IPs).
7. Deploy.

The `maxDuration = 60` exports on the generate and thumbnail routes give you the full Vercel free-tier serverless budget.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | Next.js lint |

---

## Notes & limits

- Thumbnails are stored as base64 inside MongoDB documents. This keeps the free-tier story simple (no blob storage needed) and works fine for personal use. For higher volume you'd swap to Vercel Blob, S3, or Cloudinary.
- Generation is synchronous from the client's perspective but Gemini calls inside the pipeline run in parallel where the dependency graph allows.
- All Gemini failures are wrapped in `GeminiError` and surfaced to the user as a toast — text input is preserved so users can retry without re-typing.
