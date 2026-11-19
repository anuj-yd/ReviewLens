import 'dotenv/config'

import app from './app.js'
import { connectDB } from './config/db.js'
import mongoose from 'mongoose'
import { closeReviewAnalysisQueue } from './queues/reviewAnalysis.queue.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    const shutdown = signal => {
      console.log(`Received ${signal}; shutting down API server`)
      server.close(async () => {
        await closeReviewAnalysisQueue().catch(error => {
          console.error('Queue shutdown failed:', error.message)
        })
        await mongoose.disconnect().catch(error => {
          console.error('MongoDB shutdown failed:', error.message)
        })
        process.exit(0)
      })
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))

  } catch (error) {
    console.error('Server startup failed:', error)
    process.exit(1)
  }
}

startServer()
