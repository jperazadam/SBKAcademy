import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Why a seed script instead of a SQL INSERT?
// - The seed uses bcrypt to hash the password — doing that correctly in raw
//   SQL would require a PostgreSQL extension (pgcrypto). Using the same
//   library as the application guarantees the hash format is identical.
// - The script is idempotent: running it twice does NOT create duplicates
//   (upsert pattern). Safe to re-run after a DB reset.

const prisma = new PrismaClient()

async function main() {
  const email = 'profesor@sbkacademy.com'
  const plainPassword = 'admin123'

  // bcrypt cost factor 10 is the industry standard for 2024:
  // high enough to be slow for brute-force, fast enough for a login request.
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  // upsert = INSERT if not exists, UPDATE if exists.
  // We update the password on each run so re-seeding also resets the password —
  // useful during development.
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, name: 'Profesor Admin' },
    create: {
      email,
      password: hashedPassword,
      name: 'Profesor Admin',
    },
  })

  console.log(`Seed complete. User: ${user.email} (id: ${user.id})`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
