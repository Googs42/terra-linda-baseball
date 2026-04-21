import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Public endpoint. A user submits the username/email they can't remember a
// password for, plus an optional note. We create a pending reset request
// that the coach can review + approve from Manage Users. No email required.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username_or_email, message } = req.body
  if (!username_or_email) return res.status(400).json({ error: 'Please enter your username or email.' })

  const input = String(username_or_email).trim()
  const inputLower = input.toLowerCase()
  const db = supabaseAdmin()

  // Best-effort match so the coach sees who the request is for. We don't
  // expose whether the account exists — the response is the same either way
  // so someone can't use this to probe for valid usernames.
  let matchedUserId: string | null = null
  try {
    const { data: candidates } = await db
      .from('users')
      .select('id, username, email')
    if (Array.isArray(candidates)) {
      const hit = candidates.find(u =>
        (u.username || '').toLowerCase() === inputLower ||
        (u.email || '').toLowerCase() === inputLower
      )
      if (hit) matchedUserId = hit.id
    }
  } catch (e) { /* fall through — still log the request */ }

  const { error } = await db.from('password_reset_requests').insert({
    username_or_email: input,
    matched_user_id: matchedUserId,
    message: message ? String(message).trim().slice(0, 500) : null,
    status: 'pending',
  })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({
    ok: true,
    message: "Request received. The coach will reset your password and share a new one with you.",
  })
}
