import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne, updateOne, deleteOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET')    return readAll('field_tasks', res, 'created_at')
  if (req.method === 'POST')   return insertOne('field_tasks', req.body, res)
  if (req.method === 'PATCH')  return updateOne('field_tasks', req.query.id as string, req.body, res)
  if (req.method === 'DELETE') return deleteOne('field_tasks', req.query.id as string, res)
  res.status(405).end()
}
