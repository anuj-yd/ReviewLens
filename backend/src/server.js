import 'dotenv/config'

import app from './app.js'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { getLlmConfig } from './config/llm.js'

const PORT = Number(process.env.PORT || 5000)

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

const startServer = async () => {
  try {
    getLlmConfig()
    await connectDB()

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })

    let shuttingDown = false
    const shutdown = signal => {
      if (shuttingDown) return
      shuttingDown = true
      console.log(`${signal} received; closing ReviewLens API.`)

      server.close(async error => {
        if (error) {
          console.error('HTTP server shutdown failed:', error)
          process.exitCode = 1
        }

        try {
          await mongoose.disconnect()
        } catch (disconnectError) {
          console.error('MongoDB shutdown failed:', disconnectError)
          process.exitCode = 1
        }
      })
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'))
    process.once('SIGINT', () => shutdown('SIGINT'))

  } catch (error) {
    console.error('Server startup failed:', error)
    process.exit(1)
  }
}

startServer()
