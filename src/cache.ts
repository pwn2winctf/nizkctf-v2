import { Request } from 'express'
import mcache from 'memory-cache'

export const getCache = <T, >(req: Request): T | undefined | null => {
  const key = '__express__' + req.originalUrl || req.url
  const cachedData = mcache.get(key)

  return cachedData as T
}

export const updateCache = (duration: number, data: any, req: Request): void => {
  const key = '__express__' + req.originalUrl || req.url
  mcache.put(key, data, duration * 1000)
}

export const getCacheWithAuth = <T, >(req: Request, uid: string): T | undefined | null => {
  const key = '__express__' + (req.originalUrl || req.url) + uid
  const cachedData = mcache.get(key)

  return cachedData as T
}
export const updateCacheWithAuth = (duration: number, data: any, req: Request, uid: string): void => {
  const key = '__express__' + (req.originalUrl || req.url) + uid
  mcache.put(key, data, duration * 1000)
}
