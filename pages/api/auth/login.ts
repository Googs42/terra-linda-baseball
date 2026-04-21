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

  const db = supabaseAdmin()

  // Pull every matching-role user and compare locally. Cheaper than a fancy
  // query, and handles both username-based and email-based login without
  // breaking if the optional email column hasn't been migrated in yet.
  let candidates: any[] = []
  const tryFull = await db
    .from('users')
    .select('id, name, username, role, password, email, player_link')
    .eq('role', role)
  if (tryFull.error && /column .* does not exist/i.test(tryFull.error.message)) {
    // Fall back without the optional email column
    const minimal = await db
      .from('users')
      .select('id, name, username, role, password, player_link')
      .eq('role', role)
    candidates = minimal.data || []
  } else {
    candidates = tryFull.data || []
  }

  const match = candidates.find(u =>
    u.password === password &&
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
        role: match.role,
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
