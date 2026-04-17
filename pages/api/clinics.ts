import type { NextApiRequest, NextApiResponse } from 'next'
import { readAll, insertOne, updateOne, deleteOne } from '@/lib/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET')    return readAll('clinics', res, 'clinic_date')
  if (req.method === 'POST')   return insertOne('clinics', req.body, res)
  if (req.method === 'PATCH')  return updateOne('clinics', req.query.id as string, req.body, res)
  if (req.method === 'DELETE') return deleteOne('clinics', req.query.id as string, res)
  res.status(405).end()
}
