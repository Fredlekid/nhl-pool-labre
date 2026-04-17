# 🏒 NHL Playoff Pool

A live-scoring NHL playoff pool app. Friends pick **10 forwards, 6 defensemen, 1 East team, 1 West team** — points accumulate automatically from the NHL API.

## Scoring

| Event | Points |
|---|---|
| Player goal | 1 |
| Player assist | 1 |
| Selected team wins a game | 1 |
| Selected team wins a series | 1 |

---

## Setup (5 minutes)

### 1. Clone & install

```bash
git clone <your-repo>
cd nhl-pool-app
npm install
```

### 2. Create a free Neon database

1. Go to [neon.tech](https://neon.tech) → sign up for free
2. Create a new project
3. Copy the **Connection string** (pooled) from the dashboard

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://..."   # Neon connection string (pooled)
DIRECT_URL="postgresql://..."     # Neon direct connection string (same or unpooled)
JWT_SECRET="any-random-secret"    # openssl rand -base64 32
CRON_SECRET="any-random-secret"   # any random string
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Create the admin user

After running the app, register an account at `/login`. Then in the Neon console or `psql`:

```sql
UPDATE "User" SET "isAdmin" = true WHERE name = 'YourName';
```

### 6. Load players & teams

Sign in as admin, go to `/admin` → click **Refresh Stats Now**. This fetches all 2025 playoff teams and rosters from the NHL API.

---

## Deploy to Vercel (free)

1. Push this folder to a **GitHub repo**
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
3. Add the environment variables from `.env.local` in the Vercel dashboard
4. Deploy — Vercel auto-deploys on every push

The `vercel.json` configures an **hourly cron job** to auto-refresh stats.

---

## Local dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
