import { check, ValidationChain } from 'express-validator'

import * as constants from '../../constants.json'

export const newTeamScheme:ValidationChain[] = [
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

export const newSolveScheme:ValidationChain[] = [check('challengeId').isString(), check('proof').isString().isBase64()]
