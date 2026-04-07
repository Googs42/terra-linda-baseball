# Terra Linda Baseball

**Trojans Baseball Team Portal — San Rafael, CA**

Live at: [terralindabaseball.vercel.app](https://terralindabaseball.vercel.app)

## What this app does

A full team management portal for coaches, players, and parents with:

- **Portal login** — Coach, Player, and Parent roles each see what they need
- **Roster** — Varsity and JV with CSV export
- **Schedule** — Full season with results, Home/Away, location and time
- **Game Stats** — Batting, Pitching, and Fielding
- **Position Skills** — Drills by position tagged Fundamental/Advanced/Elite
- **Workout Plans** — In-season, Off-season, and Conditioning programs
- **Field Maintenance** — Task tracker with priority levels
- **Clinics & Summer Camp** — Registration management
- **Fundraising** — Goal tracking and contribution log
- **MaxPreps Hub** — Direct links + GameChanger sync guide
- **Contact/Outreach** — Form for schools and little leagues

## Tech stack

- **Frontend/Backend**: Next.js 14 (React)
- **Database**: Supabase (Postgres)
- **Hosting**: Vercel
- **Auth**: Custom role-based portal (Coach / Player / Parent)

## Getting started locally

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase keys
3. Run `npm install`
4. Run `npm run dev`
5. Open http://localhost:3000

## Deploying

See [DEPLOY.md](./DEPLOY.md) for the full step-by-step guide.

## Default login

After deploying, sign in as Coach with:
- Username: `coach`  
- Password: `trojans2025`

Change the password immediately in Manage Users.
