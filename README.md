# Licensly

AI-Powered Corporate License Management Platform MVP.

## Architecture
- `apps/web`: React + Vite Frontend (deployed on **Vercel**)
- `apps/api`: Node.js + Express Backend (deployed on **Railway**)
- `apps/ai-service`: Python + FastAPI AI/ML microservice (deployed on **Railway**)
- `packages/shared`: Shared libraries

## Deployment — Railway

Both backend services are deployed on [Railway](https://railway.app) as separate services within a single project.

### Prerequisites
1. A Railway account connected to your GitHub repo.
2. The Vercel frontend already deployed (you'll need its URL).

### Setup Steps

#### 1. Create a Railway Project
- Go to Railway → **New Project** → **Deploy from GitHub Repo**.
- Select the `licensly-mvp` monorepo.

#### 2. Add the API Service (`apps/api`)
- In the project, click **+ New Service** → **GitHub Repo** → select the same repo.
- Set **Root Directory** to `apps/api`.
- Railway will auto-detect `railway.json` and use its build/start commands.
- Add the following **environment variables**:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Resend email API key |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g. `https://licensly.vercel.app`) |
| `SENTRY_DSN` | *(optional)* Sentry DSN for error tracking |
| `NODE_ENV` | `production` |

#### 3. Add the AI Service (`apps/ai-service`)
- Click **+ New Service** → **GitHub Repo** → select the same repo.
- Set **Root Directory** to `apps/ai-service`.
- Railway will auto-detect `railway.json` and `nixpacks.toml` (Python 3.10).
- Add the following **environment variables**:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

#### 4. Generate Domains
- For each service, go to **Settings → Networking → Generate Domain** to get a public URL.
- Update any frontend API base URLs to point to the new Railway domain.

### Health Checks
Both services expose a `/health` endpoint:
```
GET https://<api-domain>/health       → { "status": "ok", "service": "licensly-api" }
GET https://<ai-domain>/health        → { "status": "ok", "service": "licensly-ai" }
```
