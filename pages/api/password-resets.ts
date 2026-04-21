import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Coach-side management of pending password resets.
//   GET                -> list pending + recently-resolved requests
//   PATCH ?id=...      -> approve (body: { action: 'approve', new_password })
//                         or deny  (body: { action: 'deny' })
//
// This is NOT protected at the API layer; the Manage Users UI is coach-only,
// so the service-role key plus role-gated UI is the access control. If you
// ever expose this path directly, wrap it with an auth check.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { action, new_password } = req.body

    const { data: reqRow, error: reqErr } = await db
      .from('password_reset_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (reqErr || !reqRow) return res.status(404).json({ error: 'Reset request not found.' })

    if (action === 'deny') {
      const { data, error } = await db
        .from('password_reset_requests')
        .update({ status: 'denied', resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    }

    if (action === 'approve') {
      if (!new_password || String(new_password).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' })
      }
      if (!reqRow.matched_user_id) {
        return res.status(400).json({ error: 'This request isn\'t linked to a user account — edit the user manually in Manage Users instead.' })
      }

      // Update the user's password first so the request is never marked
      // approved without the password actually changing.
      const pwUpdate = await db
        .from('users')
        .update({ password: new_password })
        .eq('id', reqRow.matched_user_id)
      if (pwUpdate.error) return res.status(500).json({ error: pwUpdate.error.message })

      const { data, error } = await db
        .from('password_reset_requests')
        .update({
          status: 'approved',
          new_password, // stored for coach reference; rotate/clear if you wire up email
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    }

    return res.status(400).json({ error: 'Invalid action. Use approve or deny.' })
  }

  res.status(405).end()
}
