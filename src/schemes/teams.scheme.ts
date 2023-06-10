import { check, ValidationChain } from 'express-validator'

import * as constants from '../../constants.json'

export const newTeamScheme: ValidationChain[] = [
  check('name')
    .isString()
    .custom((name: string) => name.length > 0),
  check('countries')
    .isArray({ max: constants.maxCountriesFlag, min: 0 })
    .withMessage(`must have max ${constants.maxCountriesFlag} country flags`)
    .custom((countries: string[]) =>
      countries.every((item: string) => constants.countries.includes(item))
    )
    .withMessage('country list contains an unknown country')
]

export const newSolveScheme1: ValidationChain[] = [
  check('kPublic').isString().isHexadecimal(),
  check('kTwoPublic').isString().isHexadecimal(),
  check('publicKey').isString().isHexadecimal()
]

export const newSolveScheme2: ValidationChain[] = [
  check('sessionId').isString(),
  check('signature').isString().isHexadecimal(),
  check('message').isString()
]
