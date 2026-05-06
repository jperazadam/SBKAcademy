import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth-router'

const app = express()

app.use(cors())
app.use(express.json())

// --- Routes ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// All auth endpoints are mounted under /auth
app.use('/auth', authRouter)

export default app
