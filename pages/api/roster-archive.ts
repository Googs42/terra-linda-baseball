import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('roster_archive')
      .select('*')
      .order('archived_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const db = supabaseAdmin()
    const { season, players } = req.body
    if (!season || !Array.isArray(players) || !players.length) {
      return res.status(400).json({ error: 'season and players are required' })
    }
    const rows = players.map((p: any) => ({
      season,
      num: p.num || 0,
      name: p.name,
      pos: p.pos || '',
      year: p.year || '',
      bats: p.bats || '',
      throws: p.throws || '',
      team: p.team || '',
      status: p.status || 'Active',
      height: p.height || null,
      weight: p.weight || null,
      photo_url: p.photo_url || null,
    }))
    const { error } = await db.from('roster_archive').insert(rows)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ archived: rows.length })
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { season } = req.query
    if (!season) return res.status(400).json({ error: 'season is required' })
    const { error } = await db.from('roster_archive').delete().eq('season', season)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
