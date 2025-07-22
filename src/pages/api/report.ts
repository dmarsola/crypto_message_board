import { defaultReportData } from '@/constants/general'
import { ReportData } from '@/types/general'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = { error: string }

const reportData: ReportData = (globalThis._publicReportData = globalThis._publicReportData || defaultReportData)

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReportData | ErrorResponse>) {
  if (req.method === 'GET') {
    res.status(200).json(reportData)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
