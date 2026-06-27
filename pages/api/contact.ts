import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([req.body])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'GET') {
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { data, error } = await db
      .from('contact_requests')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const db = supabaseAdmin()
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await db.from('contact_requests').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
