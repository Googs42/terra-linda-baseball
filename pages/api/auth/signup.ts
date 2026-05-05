import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Open signup for players, parents, and coaches.
// Player + parent accounts are activated immediately.
// Coach accounts are created in a "pending" state and must be approved
// from Manage Users by Sean O'Donnell or a Head Coach before they can log in.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { first_name, last_name, username, password, role, email, phone, player_link, title } = req.body

  if (!first_name || !last_name) return res.status(400).json({ error: 'First and last name are required.' })
  if (!username) return res.status(400).json({ error: 'Username is required.' })
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  if (role !== 'player' && role !== 'parent' && role !== 'coach') {
    return res.status(400).json({ error: 'Invalid role.' })
  }

  const uname = String(username).toLowerCase().trim()
  const name = (String(first_name).trim() + ' ' + String(last_name).trim()).trim()
  const status = role === 'coach' ? 'pending' : 'active'
  const db = supabaseAdmin()

  // Refuse duplicates so the coach doesn't end up with two "jsmith" logins.
  const { data: existing } = await db.from('users').select('id').eq('username', uname).maybeSingle()
  if (existing) return res.status(409).json({ error: 'That username is already taken — please choose a different one.' })

  const core = { name, username: uname, password, role, player_link: player_link || null }
  const extras: Record<string, any> = { title: title || role, status }
  if (email) extras.email = email
  if (phone) extras.phone = phone

  let { data, error } = await db.from('users').insert({ ...core, ...extras }).select().single()

  // If the optional columns (title/email/phone/status) haven't been added to
  // the users table yet, fall back to the core fields so signup still
  // succeeds. Note: without the status column, coach approval gating won't
  // work — run users_status_migration.sql to enable it.
  if (error && /column .* does not exist/i.test(error.message)) {
    const retry = await db.from('users').insert(core).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) return res.status(500).json({ error: error.message })

  const pending = data.status === 'pending' || (status === 'pending' && data.status == null)
  return res.status(201).json({
    user: {
      id: data.id,
      name: data.name,
      username: data.username,
      role: data.role,
      player_link: data.player_link,
      status: data.status || status,
    },
    pending,
  })
}
