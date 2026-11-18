import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'

import healthRoutes from './routes/health.routes.js'
import reviewRoutes from './routes/reviews.routes.js'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}))

app.use('/api/reviews', reviewRoutes)

app.use(express.json({ limit: '1mb' }))

app.use(pinoHttp())

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
