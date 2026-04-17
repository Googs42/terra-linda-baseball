import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    // Select * so optional columns (title, email, phone, notes) come through
    // if present, without breaking when they haven't been added yet.
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('created_at')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, username, password, role, player_link, title, email, phone, notes } = req.body
    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Try inserting with the optional extras. If the DB schema hasn't been
    // migrated yet (missing title/email/phone/notes columns), Postgres will
    // return "column ... does not exist" — fall back to the core fields so
    // accounts can still be created.
    const core = { name, username: username.toLowerCase(), password, role, player_link: player_link || null }
    const extras: Record<string, any> = {}
    if (title != null) extras.title = title
    if (email != null) extras.email = email
    if (phone != null) extras.phone = phone
    if (notes != null) extras.notes = notes

    let { data, error } = await db
      .from('users')
      .insert({ ...core, ...extras })
      .select()
      .single()

    if (error && /column .* does not exist/i.test(error.message)) {
      const retry = await db.from('users').insert(core).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await db.from('users').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
