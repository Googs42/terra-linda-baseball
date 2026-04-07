import type { NextApiRequest, NextApiResponse } from 'next'
import { insertOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return insertOne('contact_requests', req.body, res)
  res.status(405).end()
}
