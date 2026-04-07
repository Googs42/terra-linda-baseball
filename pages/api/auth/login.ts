import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, password, role } = req.body
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('users')
    .select('id, name, username, role, player_link')
    .eq('username', username.toLowerCase())
    .eq('password', password)
    .eq('role', role)
    .single()

  if (error || !data) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  return res.status(200).json({ user: data })
}
