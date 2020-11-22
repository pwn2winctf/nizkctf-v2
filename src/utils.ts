import { dynamic_scoring as dynamicScore } from '../constants.json'

export function computeScore (numberOfSolves: number): number {
  const { K, V, minpts, maxpts } = dynamicScore

  return Math.trunc(
    Math.max(
      minpts,
      Math.floor(maxpts - K * Math.log2((numberOfSolves + V) / (1 + V)))
    )
  )
}
