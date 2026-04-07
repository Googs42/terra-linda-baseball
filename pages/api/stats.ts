import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne, updateOne, deleteOne } from '@/lib/apiHelpers'

// /api/stats?type=batting|pitching|fielding
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const type = req.query.type as string
  const tableMap: Record<string, string> = {
    batting:  'batting_stats',
    pitching: 'pitching_stats',
    fielding: 'fielding_stats',
  }
  const table = tableMap[type]
  if (!table) return res.status(400).json({ error: 'Invalid stat type' })

  if (req.method === 'GET')    return readAll(table, res, 'player_name')
  if (req.method === 'POST')   return insertOne(table, req.body, res)
  if (req.method === 'PATCH')  return updateOne(table, req.query.id as string, req.body, res)
  if (req.method === 'DELETE') return deleteOne(table, req.query.id as string, res)
  res.status(405).end()
}
