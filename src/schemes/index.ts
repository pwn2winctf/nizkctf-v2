import { header, ValidationChain } from 'express-validator'

export const authenticatedScheme:ValidationChain[] = [header('Authorization').isJWT()]
