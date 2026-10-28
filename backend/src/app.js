import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import placementRoutes from './routes/placementRoutes.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '16kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SmartRoute API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/placements', placementRoutes)
app.use('/api/applications', applicationRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((error, req, res, next) => {
  const status = error.status || 500
  res.status(status).json({ message: error.message || 'Internal server error' })
})

export default app
