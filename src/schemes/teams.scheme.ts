import { check, ValidationChain } from 'express-validator'

import * as constants from '../../constants.json'

export const newTeamScheme:ValidationChain[] = [
  check('name')
    .isString()
    .custom((name: string) => name.length > 0),
  check('countries')
    .isArray({ max: constants.maxCountriesFlag, min: 0 })
    .custom((countries: string[]) =>
      countries.every((item: string) => constants.countries.includes(item))
    )
]
