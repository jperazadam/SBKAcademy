import dotenv from 'dotenv'
import app from './app'

dotenv.config()

// --- Startup guard: fail fast if critical env vars are missing ---
// Why at startup and not lazily? If JWT_SECRET is missing we will never be
// able to sign or verify tokens — the server would appear healthy but
// every login would throw at runtime. It is better to crash loudly here so
// Railway/the operator notices immediately during deploy.
if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'Add it to backend/.env (local) or to the Railway service variables (production).'
  )
}

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
