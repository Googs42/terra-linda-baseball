import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne, deleteOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET')    return readAll('camp_registrations', res, 'created_at')
  if (req.method === 'POST')   return insertOne('camp_registrations', req.body, res)
  if (req.method === 'DELETE') return deleteOne('camp_registrations', req.query.id as string, res)
  res.status(405).end()
}
