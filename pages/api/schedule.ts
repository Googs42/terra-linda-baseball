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
    const { game_date, opponent, home_away, location, game_time, result, score, notes, team, is_league } = req.body
    const core = { game_date, opponent, home_away, location, game_time: game_time || null, result, score, notes, team }
    const withLeague: Record<string, any> = is_league === undefined ? {} : { is_league: !!is_league }

    let { data, error } = await db
      .from('schedule')
      .insert({ ...core, ...withLeague })
      .select()
      .single()

    // If the is_league column hasn't been added yet, fall back to core fields so
    // inserts keep working. The migration SQL adds the column.
    if (error && /column .* does not exist/i.test(error.message)) {
      const retry = await db.from('schedule').insert(core).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    const updates = { ...req.body }
    let { data, error } = await db
      .from('schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    // Same fallback as POST: if is_league column isn't there yet, strip it and retry.
    if (error && /column .* does not exist/i.test(error.message) && 'is_league' in updates) {
      const { is_league: _drop, ...rest } = updates
      const retry = await db.from('schedule').update(rest).eq('id', id).select().single()
      data = retry.data
      error = retry.error
    }

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
