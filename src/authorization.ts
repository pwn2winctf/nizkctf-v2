import admin, { FirebaseError } from 'firebase-admin'
import jwt from 'jsonwebtoken'

import { FIREBASE_CREDENTIALS, DATABASE_URL, APP_ENV } from './config'
import { AuthorizationError } from './types/errors.type'

async function validateFirebaseToken (token: string): Promise<{ uid: string, verified: boolean }> {
  try {
    const credential = FIREBASE_CREDENTIALS
    const databaseURL = DATABASE_URL

    const firebaseAdminInstance = admin.apps.length === 0 ? admin.initializeApp({
      credential: admin.credential.cert(credential),
      databaseURL
    }) : admin.app()

    const authAdmin = firebaseAdminInstance.auth()

    const { uid, email_verified: verified } = await authAdmin.verifyIdToken(token, true)
    return { uid, verified: verified || false }
  } catch (err) {
    const error = err as FirebaseError
    if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error'].includes(error.code) || error.message.includes('has no')) {
      throw new AuthorizationError('Invalid token')
    } else {
      console.error(err)
      throw new Error('Validation token error')
    }
  }
}

async function validateTestToken (token: string): Promise<{ uid: string, verified: boolean }> {
  try {
    const publicKey = FIREBASE_CREDENTIALS.public_key
    // eslint-disable-next-line
    const { user_id: userId, verified } = jwt.verify(token, publicKey) as { user_id: string, display_name: string, email: string, verified: boolean, iat: number }

    return { uid: userId, verified: verified || false }
  } catch (err) {
    throw new AuthorizationError('Invalid token')
  }
}

export const validateToken = (token: string):Promise<{ uid: string, verified: boolean }> => APP_ENV === 'test' ? validateTestToken(token) : validateFirebaseToken(token)
