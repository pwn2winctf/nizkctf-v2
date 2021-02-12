import { check, header, ValidationChain } from 'express-validator'
import { RECAPTCHA_REQUIRED, APP_ENV } from '../config'

export const authenticatedScheme: ValidationChain[] = APP_ENV === 'production' ? [header('Authorization').isJWT()] : [header('Authorization').isUUID(4)]

export const recaptchaScheme: ValidationChain[] = [check('recaptcha').optional(!RECAPTCHA_REQUIRED)]
