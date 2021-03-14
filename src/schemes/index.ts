import { check, header, ValidationChain } from 'express-validator'

import { RECAPTCHA_REQUIRED } from '../config'

export const authenticatedScheme: ValidationChain[] = [header('Authorization').isJWT()]

export const recaptchaScheme: ValidationChain[] = [check('recaptcha').optional(!RECAPTCHA_REQUIRED)]
