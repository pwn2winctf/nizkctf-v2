import { createHash } from 'crypto'
import jwtDecode from 'jwt-decode'

import { dynamic_scoring as dynamicScore } from '../constants.json'
import { MissingTokenError } from './types/errors.type'

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
    const { user_id: uid, email, display_name: displayName, verified } = jwtDecode(token) as { user_id: string, email: string, verified: boolean, display_name: string }

    return { uid, email, displayName, verified }
  } catch (err) {
    throw new MissingTokenError('Invalid token')
  }
}
