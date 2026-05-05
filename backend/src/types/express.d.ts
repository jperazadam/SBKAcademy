// Augment Express's Request type so every route can access req.user
// after the requireAuth middleware has validated the JWT.
// This file is picked up automatically by TypeScript because it is
// inside the project's rootDir ("src").

declare namespace Express {
  interface Request {
    user?: {
      id: number
      email: string
      name: string
    }
  }
}
