import { check, ValidationChain } from 'express-validator'

export const newUserScheme :ValidationChain[] = [
  check('email').isEmail(),
  check('password').isString(),
  check('displayName').isString()
]

export const loginUserScheme : ValidationChain[] = [check('email').isEmail(), check('password').isString()]
