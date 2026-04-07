import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('users')
      .select('id, name, username, role, player_link, created_at')
      .order('created_at')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, username, password, role, player_link } = req.body
    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await db
      .from('users')
      .insert({ name, username: username.toLowerCase(), password, role, player_link: player_link || null })
      .select()
      .single()
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
