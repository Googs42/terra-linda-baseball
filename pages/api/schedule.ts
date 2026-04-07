import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { team } = req.query
    let query = supabase.from('schedule').select('*').order('game_date')
    if (team) query = query.eq('team', team)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const db = supabaseAdmin()
    const { game_date, opponent, home_away, location, game_time, result, score, notes, team } = req.body
    const { data, error } = await db
      .from('schedule')
      .insert({ game_date, opponent, home_away, location, game_time: game_time || null, result, score, notes, team })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    const updates = req.body
    const { data, error } = await db
      .from('schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id } = req.query
    const { error } = await db.from('schedule').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
