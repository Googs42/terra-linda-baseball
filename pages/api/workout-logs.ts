import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { plan_id, exercise_id, from, to } = req.query
    let q = supabase.from('workout_logs').select('*, workout_exercises!inner(plan_id)')
    if (exercise_id) q = q.eq('exercise_id', exercise_id as string)
    if (plan_id)     q = q.eq('workout_exercises.plan_id', plan_id as string)
    if (from)        q = q.gte('log_date', from as string)
    if (to)          q = q.lte('log_date', to as string)
    const { data, error } = await q.order('log_date', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    // Upsert: one log row per (exercise_id, log_date)
    const db = supabaseAdmin()
    const { exercise_id, log_date, done, actual_sets, actual_reps, notes } = req.body
    if (!exercise_id || !log_date) return res.status(400).json({ error: 'exercise_id and log_date required' })
    const { data, error } = await db.from('workout_logs').upsert({
      exercise_id,
      log_date,
      done: done ?? true,
      actual_sets: actual_sets ?? null,
      actual_reps: actual_reps || null,
      notes: notes || '',
    }, { onConflict: 'exercise_id,log_date' }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id, exercise_id, log_date } = req.query
    if (id) {
      const { error } = await db.from('workout_logs').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }
    if (exercise_id && log_date) {
      const { error } = await db.from('workout_logs').delete()
        .eq('exercise_id', exercise_id as string)
        .eq('log_date', log_date as string)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }
    return res.status(400).json({ error: 'Pass either id, or both exercise_id + log_date' })
  }

  res.status(405).end()
}
