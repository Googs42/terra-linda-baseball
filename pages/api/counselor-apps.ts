import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne, deleteOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET')    return readAll('counselor_apps', res, 'created_at')
  if (req.method === 'POST')   return insertOne('counselor_apps', req.body, res)
  if (req.method === 'DELETE') return deleteOne('counselor_apps', req.query.id as string, res)
  res.status(405).end()
}
