import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import healthRoutes from './routes/health.routes.js'
import reviewRoutes from './routes/reviews.routes.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist')
const hasFrontendDist = fs.existsSync(frontendDistPath)

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0 && !hasFrontendDist) {
  console.warn('⚠️  [WARNING] CLIENT_URL is not set. Add CLIENT_URL=<your-vercel-url> in Render Environment Variables to allow browser access.')
}

const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : ['http://localhost:5173']

app.use(helmet({
  contentSecurityPolicy: false
}))

app.use(cors({
  origin: (origin, callback) => {
    // Allow command-line and server-to-server health checks (requests without Origin header)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes('*')) return callback(null, true)
    const normalized = origin.replace(/\/$/, '')
    callback(null, allowedOrigins.includes(normalized) || allowedOrigins.includes(origin))
  }
}))

// Attach request logging before routes so controller errors include req.log.
app.use(pinoHttp())

app.use(express.json({ limit: '1mb' }))

app.use('/api/reviews', reviewRoutes)

app.use('/api/health', healthRoutes)

// If frontend build exists, serve static client files and SPA routing
if (hasFrontendDist) {
  app.use(express.static(frontendDistPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

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
