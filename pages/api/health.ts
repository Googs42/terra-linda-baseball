import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Diagnostic endpoint: tells the coach *exactly* what's wrong when saves
// aren't persisting. Checks env vars, then tries a real read + write round trip.
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) {
    return res.status(200).json({
      ok: false,
      stage: 'env',
      missing,
      hint: 'Set these in Vercel → Project Settings → Environment Variables, then redeploy.',
    })
  }

  const db = supabaseAdmin()
  if (!db) {
    return res.status(200).json({
      ok: false,
      stage: 'client',
      hint: 'Supabase admin client could not initialize even though env vars are set. Check for typos or trailing whitespace.',
    })
  }

  // Read probe
  const read = await db.from('roster').select('id', { count: 'exact', head: true })
  if (read.error) {
    return res.status(200).json({
      ok: false,
      stage: 'read',
      error: read.error.message,
      hint: 'Run supabase/schema.sql in the Supabase SQL Editor so the tables exist.',
    })
  }

  // Write probe (insert + delete a throwaway row in users)
  const probeName = `__health_probe_${Date.now()}`
  const probeUser = `probe_${Date.now()}`
  const ins = await db
    .from('users')
    .insert({ name: probeName, username: probeUser, password: 'x', role: 'coach' })
    .select()
    .single()

  if (ins.error || !ins.data) {
    return res.status(200).json({
      ok: false,
      stage: 'write',
      error: ins.error?.message || 'insert returned no row',
      hint: 'SUPABASE_SERVICE_ROLE_KEY is likely missing or wrong, or RLS is blocking writes.',
    })
  }

  // Clean up
  await db.from('users').delete().eq('id', ins.data.id)

  return res.status(200).json({
    ok: true,
    stage: 'ready',
    rosterCount: read.count ?? null,
  })
}
