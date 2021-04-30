import dotEnvFlow from 'dotenv-flow'

dotEnvFlow.config()

export const APP_ENV: 'development' | 'production' | 'test' = process.env.APP_ENV === 'production' ? 'production' : process.env.APP_ENV === 'test' ? 'test' : 'development'
export const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || ''
export const RECAPTCHA_REQUIRED = process.env.RECAPTCHA_REQUIRED === 'true'
export const FIREBASE_CREDENTIALS = JSON.parse(process.env.CREDS || '')
export const PORT = process.env.PORT || ''

export const DATABASE_URL = process.env.DATABASE_URL || ''
export const DATABASE_HOST = process.env.DATABASE_HOST || ''
export const DATABASE_USER = process.env.DATABASE_USER || ''
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || ''
