import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Checking backend...')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/health`
        )

        if (!response.ok) {
          throw new Error('Backend request failed')
        }

        const data = await response.json()
        setStatus(data.message)

      } catch (error) {
        setStatus('Backend connection failed')
        console.error(error)
      }
    }

    checkBackend()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-blue-400">
          ReviewLens
        </h1>

        <p className="text-slate-300">
          AI-Powered Customer Review Insights
        </p>

        <div className="rounded-lg bg-slate-800 p-4">
          Backend Status: {status}
        </div>
      </div>
    </div>
  )
}

export default App