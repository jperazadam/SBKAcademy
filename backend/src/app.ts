import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth-router'
import studentsRouter from './routes/students-router'

const app = express()

app.use(cors())
app.use(express.json())

// --- Routes ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// All auth endpoints are mounted under /auth
app.use('/auth', authRouter)

// Student CRUD — requires JWT authentication
app.use('/students', studentsRouter)

export default app
