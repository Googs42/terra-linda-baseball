import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { plan_id } = req.query
    if (!plan_id) return res.status(400).json({ error: 'plan_id required' })
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('plan_id', plan_id as string)
      .order('order_idx', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const db = supabaseAdmin()
    const { plan_id, name, day_of_week, target_sets, target_reps, notes, order_idx } = req.body
    if (!plan_id || !name) return res.status(400).json({ error: 'plan_id and name required' })
    const { data, error } = await db.from('workout_exercises').insert({
      plan_id,
      name,
      day_of_week: day_of_week ?? null,
      target_sets: target_sets ?? 0,
      target_reps: target_reps || '',
      notes: notes || '',
      order_idx: order_idx ?? 0,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const allowed = ['name', 'day_of_week', 'target_sets', 'target_reps', 'notes', 'order_idx']
    const updates: Record<string, any> = {}
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k]
    const { data, error } = await db.from('workout_exercises').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await db.from('workout_exercises').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
