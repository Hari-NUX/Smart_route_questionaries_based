import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  }
}

function createSession(user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })

  return { token, user: toPublicUser(user) }
}

export async function registerUser({ fullName, email, password, role, inviteCode }) {
  if (role === 'admin' && (!process.env.ADMIN_SIGNUP_CODE || inviteCode !== process.env.ADMIN_SIGNUP_CODE)) {
    const error = new Error('A valid host invite code is required')
    error.status = 403
    throw error
  }

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    const error = new Error('An account with this email already exists')
    error.status = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ fullName, email, passwordHash, role })
  return createSession(user)
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const validPassword = user && await bcrypt.compare(password, user.passwordHash)

  if (!validPassword) {
    const error = new Error('Email or password is incorrect')
    error.status = 401
    throw error
  }

  return createSession(user)
}

export function getCurrentUser(user) {
  return toPublicUser(user)
}
