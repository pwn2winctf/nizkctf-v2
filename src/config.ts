export const APP_ENV = process.env.ENV || 'development'
export const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || ''
export const RECAPTCHA_REQUIRED = !!(process.env.RECAPTCHA_REQUIRED) || false
