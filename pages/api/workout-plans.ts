import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { player_id } = req.query
    let q = supabase.from('workout_plans').select('*').order('created_at', { ascending: false })
    if (player_id) q = q.eq('player_id', player_id as string)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const db = supabaseAdmin()
    const { player_id, plan_name, notes, start_date, end_date } = req.body
    if (!player_id) return res.status(400).json({ error: 'player_id required' })
    const { data, error } = await db.from('workout_plans').insert({
      player_id,
      plan_name: plan_name || 'Training plan',
      notes: notes || '',
      start_date: start_date || null,
      end_date: end_date || null,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const allowed = ['plan_name', 'notes', 'start_date', 'end_date']
    const updates: Record<string, any> = {}
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k]
    const { data, error } = await db.from('workout_plans').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await db.from('workout_plans').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
