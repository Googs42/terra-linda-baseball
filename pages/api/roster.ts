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
    const { num, name, pos, year, bats, throws, team, status } = req.body
    if (!name || !team) {
      return res.status(400).json({ error: 'Name and team are required' })
    }
    const { data, error } = await db
      .from('roster')
      .insert({
        num: num || 0,
        name,
        pos: pos || 'TBD',
        year: year || 'TBD',
        bats: bats || 'R',
        throws: throws || 'R',
        team,
        status: status || 'Active',
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    // Pass through only known columns to avoid "column does not exist" errors
    const allowed = ['num','name','pos','year','bats','throws','team','status','offseason_goals']
    const updates: Record<string, any> = {}
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k]
    }
    let { data, error } = await db
      .from('roster')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    // Fallback for DBs that haven't run the offseason_goals migration yet.
    if (error && /column .* does not exist/i.test(error.message) && 'offseason_goals' in updates) {
      const { offseason_goals: _drop, ...rest } = updates
      const retry = await db.from('roster').update(rest).eq('id', id).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
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
