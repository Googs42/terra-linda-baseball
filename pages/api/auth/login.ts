import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Fallback credentials — always valid as a last-resort login so the coach
// can never lock themselves out by deleting every user row.
const FALLBACK_USERNAME = 'coach'
const FALLBACK_PASSWORD = 'trojans2025'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, password, role } = req.body
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const input = String(username).trim()
  const inputLower = input.toLowerCase()
  const wantedRole = String(role).toLowerCase()

  const db = supabaseAdmin()

  // Pull every user and compare locally. We can't trust the `role` column
  // to always equal exactly 'coach' / 'player' / 'parent' — rows created
  // directly in Supabase (or by older seed data) sometimes have title values
  // like 'head_coach'. So we normalize the stored role/title to one of the
  // three buckets before matching against the role the user picked.
  let candidates: any[] = []
  const tryFull = await db
    .from('users')
    .select('id, name, username, role, password, email, title, player_link')
  if (tryFull.error && /column .* does not exist/i.test(tryFull.error.message)) {
    const minimal = await db
      .from('users')
      .select('id, name, username, role, password, player_link')
    candidates = minimal.data || []
  } else {
    candidates = tryFull.data || []
  }

  // Map anything stored in role or title to canonical coach/player/parent
  function canonicalRole(u: any): string {
    const raw = String(u.role || u.title || '').toLowerCase()
    if (raw === 'player') return 'player'
    if (raw === 'parent') return 'parent'
    // Everything coaching-staff-ish collapses to 'coach'
    if (raw === 'coach' || raw === 'head_coach' || raw === 'assistant_coach' ||
        raw === 'head coach' || raw === 'assistant coach' ||
        raw === 'costumes' || raw === 'idea_guy' || raw === 'idea guy' ||
        raw.includes('coach')) return 'coach'
    return raw
  }

  const match = candidates.find(u =>
    String(u.password || '') === String(password) &&
    canonicalRole(u) === wantedRole &&
    (
      (u.username || '').toLowerCase() === inputLower ||
      (u.email || '').toLowerCase() === inputLower
    )
  )
  if (match) {
    return res.status(200).json({
      user: {
        id: match.id,
        name: match.name,
        username: match.username,
        role: canonicalRole(match),
        player_link: match.player_link,
      },
    })
  }

  // Lockout-safety fallback: lets coach/trojans2025 in even if the users
  // table has been wiped. Only accepts the 'coach' role.
  if (
    role === 'coach' &&
    inputLower === FALLBACK_USERNAME &&
    password === FALLBACK_PASSWORD
  ) {
    return res.status(200).json({
      user: {
        id: 'fallback-coach',
        name: 'Head Coach',
        username: FALLBACK_USERNAME,
        role: 'coach',
        player_link: null,
      },
    })
  }

  return res.status(401).json({ error: 'Invalid credentials' })
}
