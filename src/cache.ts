import { Request } from 'express'
import mcache from 'memory-cache'

export const getCache = (req: Request): any => {
  const key = '__express__' + req.originalUrl || req.url
  const cachedData = mcache.get(key)

  return cachedData
}

export const updateCache = (duration: number, data: any, req: Request): void => {
  const key = '__express__' + req.originalUrl || req.url
  mcache.put(key, data, duration * 1000)
}
