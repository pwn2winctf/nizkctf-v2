import { check, ValidationChain } from 'express-validator'

export const newUserScheme :ValidationChain[] = [
  check('shareInfo').isBoolean()
]

export const loginUserScheme : ValidationChain[] = [check('email').isEmail(), check('password').isString()]
