import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'

import healthRoutes from './routes/health.routes.js'
import reviewRoutes from './routes/reviews.routes.js'

const app = express()

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
  throw new Error('CLIENT_URL must contain the deployed frontend origin in production.')
}

const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : ['http://localhost:5173']

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    // Allow command-line and server-to-server health checks, while limiting
    // browser requests to explicitly configured frontend origins.
    callback(null, !origin || allowedOrigins.includes(origin))
  }
}))

// Attach request logging before routes so controller errors include req.log.
app.use(pinoHttp())

app.use(express.json({ limit: '1mb' }))

app.use('/api/reviews', reviewRoutes)

app.use('/api/health', healthRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.use((error, req, res, next) => {
  req.log?.error(error)

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
})

export default app
