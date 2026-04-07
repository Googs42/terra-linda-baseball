import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET')  return readAll('camp_registrations', res, 'created_at')
  if (req.method === 'POST') return insertOne('camp_registrations', req.body, res)
  res.status(405).end()
}
