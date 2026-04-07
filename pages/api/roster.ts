import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('roster')
      .select('*')
      .order('num')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const db = supabaseAdmin()
    const { num, name, pos, year, bats, throws, team } = req.body
    const { data, error } = await db
      .from('roster')
      .insert({ num, name, pos, year, bats, throws, team, status: 'Active' })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id } = req.query
    const { error } = await db.from('roster').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
