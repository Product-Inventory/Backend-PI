import dotenv from 'dotenv'

dotenv.config()

function parseCorsOrigin(value) {
  if (value === undefined || value === null || value === '') {
    return true
  }

  const normalized = String(value).trim()

  if (normalized === '*' || normalized.toLowerCase() === 'true') {
    return true
  }

  const origins = normalized
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (origins.length <= 1) {
    return origins[0] || true
  }

  return origins
}

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback

  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const env = {
  PORT: Number(process.env.PORT || 3001),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: parseCorsOrigin(process.env.CORS_ORIGIN),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  FIREBASE_PROJECT_ID: required('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: required('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: required('FIREBASE_PRIVATE_KEY')
}