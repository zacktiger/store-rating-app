# Deploying

Three pieces: a Postgres database, the Express API, and the React build. All of them have a free
tier that is enough for a demo.

The setup below uses **Neon** for the database, **Render** for the API and **Vercel** for the
frontend. Any equivalent host works — the app only needs the environment variables listed here.

## 1. Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string. It looks like
   `postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require`.

Neon's free database does not expire, which is why it is used here rather than Render's own
Postgres — that one is deleted after 30 days, and a submitted link that dies is worse than no link.

## 2. Seed the database from your own machine

Render's free tier has no shell access, so the seed script is run locally against the hosted
database instead. Neon is reachable over the internet, so this works from anywhere.

From the `backend` folder, pass the hosted connection string as an environment variable. It
overrides whatever is in `.env` for that one command, so your local setup is left alone:

```bash
# Git Bash / macOS / Linux
DATABASE_URL="<neon connection string>" DATABASE_SSL=true npm run db:setup
```

```powershell
# PowerShell
$env:DATABASE_URL = "<neon connection string>"
$env:DATABASE_SSL = "true"
npm run db:setup
Remove-Item Env:DATABASE_URL, Env:DATABASE_SSL   # back to the local database
```

This creates the tables and the demo accounts, and prints the logins when it finishes. It **drops
the tables first**, so run it once at setup and not again unless you want to wipe the data.

Do this before or after deploying the API — the order does not matter, the API just needs the
tables to exist by the time someone logs in.

## 3. API (Render)

1. At [render.com](https://render.com), create a **New Web Service** from the GitHub repo.
2. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Environment variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | the Neon connection string from step 1 |
   | `DATABASE_SSL` | `true` |
   | `JWT_SECRET` | a long random string — generate one, do not reuse the dev default |
   | `FRONTEND_ORIGIN` | the Vercel URL from step 4, e.g. `https://store-rating-app.vercel.app` |

   `PORT` is set by Render itself; the app already reads it.

4. Deploy. Once it is live, `https://<your-service>.onrender.com/api/health` should return
   `{"status":"ok"}` — that confirms the service is up even before the frontend exists.

Two things about the free tier:

- **No shell access**, which is why the database is seeded from your machine in step 2 rather than
  from a Render terminal.
- **The service sleeps after inactivity**, so the first request after a quiet period takes 30–60
  seconds. Worth mentioning next to the link so nobody thinks the app is broken.

## 4. Frontend (Vercel)

1. At [vercel.com](https://vercel.com), import the same repo.
2. Settings:
   - **Root directory:** `frontend`
   - Framework preset **Vite** (detected automatically)
3. Environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | the Render URL plus `/api`, e.g. `https://store-rating-api.onrender.com/api` |

4. Deploy.

`vercel.json` sends every path to `index.html`. Without it, opening `/admin/users` directly or
refreshing on any route returns a 404, because those paths only exist in the browser's router.
`public/_redirects` does the same job if you deploy to Netlify instead.

## 5. Close the loop

Set `FRONTEND_ORIGIN` on Render to the real Vercel URL and redeploy the API — CORS rejects the
browser's requests until it matches. Then open the site, log in as each demo account, and check
that the store list loads and a rating saves.

## Environment variables at a glance

**Backend**

| Key | Local | Deployed |
|-----|-------|----------|
| `PORT` | `4200` | set by the host |
| `DATABASE_URL` | local container | hosted connection string |
| `DATABASE_SSL` | unset | `true` |
| `JWT_SECRET` | dev default | a long random string |
| `FRONTEND_ORIGIN` | `http://localhost:5180` | the deployed frontend URL |

**Frontend**

| Key | Local | Deployed |
|-----|-------|----------|
| `VITE_API_URL` | `http://localhost:4200/api` | the deployed API URL plus `/api` |
