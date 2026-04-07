# Terra Linda Baseball - Deployment Guide
# Gets you live at terralindabaseball.vercel.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SUPABASE (your database)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
   - Name: terra-linda-baseball
   - Database password: choose a strong password (save it)
   - Region: West US (closest to San Rafael)
3. Wait ~2 minutes for it to spin up
4. Click "SQL Editor" in the left sidebar
5. Click "New Query"
6. Open the file: supabase/schema.sql
7. Copy the entire contents and paste into the SQL editor
8. Click "Run" (green button)
   → You should see "Success. No rows returned"
   → This creates all your tables and loads starter data
9. Go to Project Settings → API
10. Copy these three values (you'll need them in Step 3):
    - Project URL  (looks like: https://abcdefgh.supabase.co)
    - anon/public key  (long string starting with eyJ...)
    - service_role key  (another long string - keep this SECRET)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — GITHUB (your code storage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://github.com and sign in (or sign up free)
2. Click the "+" in the top right → "New repository"
   - Repository name: terra-linda-baseball
   - Set to Private (recommended)
   - Do NOT check "Add a README"
   - Click "Create repository"
3. GitHub will show you a page with setup commands
4. On your computer, open Terminal (Mac) or Command Prompt (Windows)
5. Navigate to the project folder:
   cd path/to/tlbaseball
6. Run these commands one at a time:

   git init
   git add .
   git commit -m "Initial Terra Linda Baseball app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/terra-linda-baseball.git
   git push -u origin main

   (Replace YOUR_USERNAME with your actual GitHub username)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — VERCEL (makes it live on the web)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://vercel.com and sign up using your GitHub account
   (Click "Continue with GitHub" - easiest way)
2. Click "Add New Project"
3. Find "terra-linda-baseball" in the list and click "Import"
4. On the Configure Project screen:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: leave as is
   - Click "Environment Variables" to expand it
5. Add these three environment variables one at a time:
   
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: (paste your Project URL from Supabase Step 1)
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
   Value: (paste your anon/public key from Supabase Step 1)
   
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: (paste your service_role key from Supabase Step 1)

6. Click "Deploy"
7. Wait about 2 minutes for it to build
8. Vercel gives you a URL like: terra-linda-baseball.vercel.app
9. To get terralindabaseball.vercel.app specifically:
   - Go to your project Settings → Domains
   - Click "Edit" on the auto-generated domain
   - Type: terralindabaseball
   - Click Save

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — FIRST LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Go to your live URL and sign in as Coach:
  Username: coach
  Password: trojans2025

First thing to do: go to Manage Users and change the coach password!
Then start adding player and parent accounts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUTURE UPDATES (how to push changes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every time you want to update the app:
  git add .
  git commit -m "Description of what you changed"
  git push

Vercel automatically detects the push and redeploys in ~2 minutes.
Your live site updates automatically. No extra steps needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build fails on Vercel:
  → Check that all 3 environment variables are set correctly
  → Check the Vercel "Build Logs" for the specific error

Login doesn't work on live site:
  → Make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel env vars
  → Check Supabase dashboard → Logs to see if requests are coming in

Data not loading:
  → Make sure you ran the schema.sql in Supabase SQL Editor
  → Check NEXT_PUBLIC_SUPABASE_URL has no trailing slash

Need help: support@vercel.com or support@supabase.com both respond fast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT EACH SERVICE DOES (and cost)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Supabase FREE tier includes:
  - 500MB database storage
  - 2GB file storage  
  - 50,000 monthly active users
  → More than enough for a high school team forever

Vercel FREE tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Custom domain support
  → More than enough

GitHub FREE tier:
  - Unlimited private repos
  - Unlimited storage for code

Total cost: $0/month
