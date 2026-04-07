import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Generic handler factory used by stats/fundraising/tasks endpoints
export async function readAll(table: string, res: NextApiResponse, orderBy = 'created_at') {
  const { data, error } = await supabase.from(table).select('*').order(orderBy as any)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}

export async function insertOne(table: string, body: object, res: NextApiResponse) {
  const db = supabaseAdmin()
  const { data, error } = await db.from(table).insert(body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}

export async function updateOne(table: string, id: string, body: object, res: NextApiResponse) {
  const db = supabaseAdmin()
  const { data, error } = await db.from(table).update(body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}

export async function deleteOne(table: string, id: string, res: NextApiResponse) {
  const db = supabaseAdmin()
  const { error } = await db.from(table).delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
