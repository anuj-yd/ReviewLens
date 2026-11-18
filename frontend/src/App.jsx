import { useState } from 'react'
import { uploadReviews } from './services/reviewApi'

function App() {
  const [file, setFile] = useState(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [result, setResult] = useState(null)

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!file) {
      setError('Please select a CSV file.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await uploadReviews(file)

      setResult(data)

    } catch (err) {
      setError(err.message)

    } finally {
      setLoading(false)
    }
  }

  const stats = result?.summary

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-blue-400">
            ReviewLens
          </h1>

          <p className="text-slate-400 mt-2">
            AI-Powered Customer Review Insights
          </p>
        </header>

        {/* Upload Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            Upload Customer Reviews
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            Upload your reviews CSV file to clean and process customer feedback.
          </p>

          <form onSubmit={handleUpload}>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setError('')
                setResult(null)
              }}
              className="block w-full text-sm text-slate-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700"
            />

            {file && (
              <p className="text-sm text-slate-400 mt-3">
                Selected: {file.name}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 px-6 py-3 rounded-lg bg-blue-600
              hover:bg-blue-700 disabled:opacity-50
              disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Upload Reviews'}
            </button>

          </form>

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-red-950 text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 p-4 rounded-lg bg-green-950 text-green-300">
              {result.message}
            </div>
          )}

        </section>

        {/* Upload Summary */}
        {stats && (
          <section className="mt-8">

            <h2 className="text-xl font-semibold mb-5">
              Upload Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <StatCard
                title="Total CSV Rows"
                value={stats.totalRows}
              />

              <StatCard
                title="Accepted Reviews"
                value={stats.acceptedReviewRows}
              />

              <StatCard
                title="Unique Reviews"
                value={stats.uniqueReviewCount}
              />

              <StatCard
                title="Duplicates"
                value={stats.duplicateCount}
              />

              <StatCard
                title="Empty Reviews"
                value={stats.skippedEmptyReviews}
              />

              <StatCard
                title="Missing Ratings"
                value={stats.missingRatingCount}
              />

              <StatCard
                title="Invalid Ratings"
                value={stats.invalidRatingCount}
              />

              <StatCard
                title="Invalid Dates"
                value={stats.invalidDateCount}
              />

            </div>

          </section>
        )}

        {/* Reviews Preview */}
        {result?.reviews?.length > 0 && (
          <section className="mt-10">

            <h2 className="text-xl font-semibold mb-5">
              Cleaned Reviews
            </h2>

            <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">

              <table className="w-full text-sm text-left">

                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="p-4">Review ID</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Review</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>

                  {result.reviews.map((review) => (

                    <tr
                      key={review.reviewId}
                      className="border-t border-slate-800"
                    >

                      <td className="p-4">
                        {review.reviewId}
                      </td>

                      <td className="p-4">
                        {review.product}
                      </td>

                      <td className="p-4">
                        {review.rating ?? 'Unknown'}
                      </td>

                      <td className="p-4 max-w-sm">
                        <p className="line-clamp-3">
                          {review.reviewText}
                        </p>
                      </td>

                      <td className="p-4">
                        {review.isDuplicate ? (
                          <span className="text-yellow-400">
                            Duplicate of {review.duplicateOf}
                          </span>
                        ) : (
                          <span className="text-green-400">
                            Ready for analysis
                          </span>
                        )}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </div>

    </main>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {value}
      </h3>

    </div>
  )
}

export default App