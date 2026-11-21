import { analyseImportReviews } from '../services/bulkAnalysis.service.js'

export const bulkAnalyseImport = async (req, res) => {
  try {
    const result = await analyseImportReviews(req.params.importId)
    const quotaExhausted = result.metrics?.quotaExhausted

    return res.status(200).json({
      success: true,
      message: quotaExhausted
        ? `Bulk analysis stopped because the ${result.metrics.quotaProvider || 'AI provider'} request quota is exhausted.`
        : 'Bulk review analysis completed.',
      ...result
    })
  } catch (error) {
    req.log?.error({ err: error }, 'Bulk review analysis failed')

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Bulk review analysis failed.'
    })
  }
}
