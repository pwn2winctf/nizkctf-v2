import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { dynamic_scoring as dynamicScore } from '../constants.json'
import { MissingTokenError } from './types/errors.type'

dayjs.extend(customParseFormat)

export function computeScore (numberOfSolves: number): number {
  const { K, V, minpts, maxpts } = dynamicScore

  return Math.trunc(
    Math.max(
      minpts,
      Math.floor(maxpts - K * Math.log2((numberOfSolves + V) / (1 + V)))
    )
  )
}

export function createSHA256 (data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export async function getUserDataFromJWT (token: string): Promise<{ uid: string, email: string, verified: boolean, displayName: string }> {
  try {
    // eslint-disable-next-line
    const { user_id: uid, email, display_name: displayName, verified } = jwt.decode(token) as { user_id: string, email: string, verified: boolean, display_name: string }

    return { uid, email, displayName, verified }
  } catch (err) {
    throw new MissingTokenError('Invalid token')
  }
}

export const START_SUBSCRIPTION_DATE = dayjs('02-05-2021 08:00 -03:00', 'DD-MM-YYYY HH:mm Z').toDate()
export const START_EVENT_DATE = dayjs('28-05-2021 13:37 -03:00', 'DD-MM-YYYY HH:mm Z').toDate()
export const END_EVENT_DATE = dayjs('30-05-2021 13:37 -03:00', 'DD-MM-YYYY HH:mm Z').toDate()
