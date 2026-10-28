import { z } from 'zod'
import { getCurrentUser, loginUser, registerUser } from '../services/authService.js'

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  role: z.enum(['candidate', 'admin']).default('candidate'),
  inviteCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
})

function parseBody(schema, body) {
  const result = schema.safeParse(body)

  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Invalid request')
    error.status = 400
    throw error
  }

  return result.data
}

export async function signup(req, res) {
  const data = parseBody(signupSchema, req.body)
  const session = await registerUser(data)
  res.status(201).json(session)
}

export async function login(req, res) {
  const data = parseBody(loginSchema, req.body)
  const session = await loginUser(data)
  res.json(session)
}

export function me(req, res) {
  res.json({ user: getCurrentUser(req.user) })
}
