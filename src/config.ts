import dotEnvFlow from 'dotenv-flow'

dotEnvFlow.config()

export const APP_ENV = process.env.APP_ENV || 'development'
export const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || ''
export const RECAPTCHA_REQUIRED = process.env.RECAPTCHA_REQUIRED === 'true'
export const FIREBASE_CREDENTIALS = JSON.parse(process.env.CREDS || '')
export const DATABASE_URL = process.env.DATABASE_URL || ''
export const PORT = process.env.PORT || ''
