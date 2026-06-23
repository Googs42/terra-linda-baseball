import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Self-service password change. Requires the current password to verify identity.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, current_password, new_password } = req.body
  if (!username || !current_password || !new_password) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }
  if (String(new_password).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  }

  const db = supabaseAdmin()
  const usernameLower = String(username).trim().toLowerCase()

  const { data: candidates } = await db
    .from('users')
    .select('id, username, email, password')

  const user = (candidates || []).find(u =>
    (u.username || '').toLowerCase() === usernameLower ||
    (u.email || '').toLowerCase() === usernameLower
  )

  // Return the same error whether the user doesn't exist or the password is wrong
  // so callers can't use this to probe for valid usernames.
  if (!user || String(user.password || '') !== String(current_password)) {
    return res.status(401).json({ error: 'Username or current password is incorrect.' })
  }

  const { error } = await db
    .from('users')
    .update({ password: new_password })
    .eq('id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
