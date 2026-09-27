# Customer Service Record

A simple internal web app for tracking customer MA-405 tester service records —
replacing the paper checklist with a searchable, shared database.

- **Sales team:** search by customer name or serial number, see current status at a glance.
- **Production team:** everything Sales sees, plus the ability to log a new intake and add service records (checklist, investigation notes, parts, services).

No individual accounts — each team logs in with one shared password.

---

## 1. One-time setup

### A. Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free account, then a new project (pick any name/region).
2. Once it's created, go to **SQL Editor** → **New Query**, paste in the entire contents of `schema.sql` from this project, and click **Run**. This creates the two tables (`units` and `service_records`).
3. Go to **Project Settings → API**. You'll need two values from here in step C below:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role key**, under "Project API keys" — click to reveal it (`SUPABASE_SERVICE_ROLE_KEY`). Keep this secret; never share it or put it in a public place.

### B. Put this project on GitHub

1. Create a new **private** repository on your GitHub account (e.g. `customer-service-record`).
2. Upload every file from this project into that repository (drag-and-drop works fine on GitHub's web UI, or use `git push` if you're comfortable with that).

### C. Deploy it (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up using your GitHub account.
2. Click **Add New → Project**, and pick the repository you just created.
3. Before deploying, open **Environment Variables** and add these (values from Supabase, plus your own passwords):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | from Supabase Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Project Settings → API |
   | `SALES_PASSWORD` | whatever password you want Sales to use |
   | `PRODUCTION_PASSWORD` | whatever password you want Production to use |
   | `SESSION_SECRET` | any long random string (mash your keyboard for 40+ characters) |

4. Click **Deploy**. In a minute or two you'll get a live URL like `customer-service-record.vercel.app`.
5. From then on: any time you (or I) update the code and push it to GitHub, Vercel automatically redeploys — no extra steps.

### D. Use it day-to-day

- Open the Vercel URL on any phone, tablet, or laptop browser.
- On a phone, you can add it to your home screen (Share → Add to Home Screen on iPhone, or the browser menu → Add to Home Screen on Android) so it opens like an app.
- Since it's a private Supabase project and a shared password only your staff knows, it's not something the public can stumble onto or search-engine-index.

---

## 2. Data & backups

- Supabase automatically backs up your database daily on its own, for as long as your project exists — no setup needed.
- As a second, independent backup layer that you fully control: in Supabase, go to **Database → Backups**, or periodically run **Table Editor → Export → CSV** on both tables and save the file into a `backups/` folder in your GitHub repo. Doing this monthly (calendar reminder) gives you a permanent, timestamped copy that lives outside Supabase entirely.

---

## 3. Project structure

```
pages/
  login.js              Team password screen
  index.js               Search dashboard
  units/[id].js           Unit detail + service history + new record form
  api/
    login.js, logout.js  Session handling
    units/index.js       Search/list units, create new intake
    units/[id].js        Get unit + history, add new service record
lib/
  supabaseAdmin.js        Server-side database connection
  auth.js                 Cookie-based session (shared team passwords)
schema.sql                Run this once in Supabase to create the tables
```

## 4. Local development (optional)

If you want to run this on your own computer before/instead of deploying:

```bash
npm install
cp .env.example .env.local   # then fill in your real values
npm run dev
```

Then open `http://localhost:3000`.
