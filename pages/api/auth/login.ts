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

  const uname = String(username).toLowerCase()

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('users')
    .select('id, name, username, role, player_link')
    .eq('username', uname)
    .eq('password', password)
    .eq('role', role)
    .single()

  if (!error && data) return res.status(200).json({ user: data })

  // Lockout-safety fallback: lets coach/trojans2025 in even if the users
  // table has been wiped. Only accepts the 'coach' role.
  if (
    role === 'coach' &&
    uname === FALLBACK_USERNAME &&
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
