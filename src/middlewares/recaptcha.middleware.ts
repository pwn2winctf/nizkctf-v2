import { NextFunction, Request, Response } from 'express'
import axios from 'axios'

import { RECAPTCHA_REQUIRED, RECAPTCHA_SECRET } from '../config'
import { SemanticError } from '../types/errors.type'

const RECAPTCHA_URL = new URL('https://www.google.com/recaptcha/api/siteverify').toString()

export default async function recaptchaMiddleware (req: Request, _: Response, next:NextFunction):Promise<void> {
  if (!RECAPTCHA_REQUIRED) {
    next()
    return
  }

  const recaptcha:string = req.body.recaptcha
  const searchParams = new URLSearchParams({ secret: RECAPTCHA_SECRET, recaptcha })

  const { data } = await axios.post(RECAPTCHA_URL, {}, { params: searchParams })

  if (!data.success) {
    next(new SemanticError('Invalid recaptcha'))
  }

  next()
}
