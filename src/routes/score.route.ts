import { Router, Request, Response, NextFunction } from 'express'

import { Database } from '../app'
import { computeScore } from '../utils'

interface TaskStat {
  points: number
  time: number
}

interface Standing {
  pos: number
  team: string
  score: number
  taskStats: {
    [challengeId: string]: TaskStat
  }
  lastAccept: number
}

interface Score {
  standings: Standing[]
  tasks: string[]
}

export default function score (database: Database): Router {
  const router = Router()

  router.get('/', async (_: Request, res: Response, next: NextFunction) => {
    try {
      const challenges = await database.challenges.all()
      const solves = await database.solves.all()

      const tasks = Object.keys(challenges)

      const teamsThatSolvedSomeChallenge = Object.keys(solves)

      const challengeSolvesAmount: {
        [challengeId: string]: number
      } = Object.values(solves).reduce(
        (obj: { [challengeId: string]: number }, solve) => {
          Object.entries(solve).forEach(([challengeId]) => {
            obj[challengeId] = (obj[challengeId] || 0) + 1
          })
          return obj
        },
        {}
      )

      const temporaryStandings = await Promise.all(
        teamsThatSolvedSomeChallenge.map(async team => {
          const taskStats = Object.entries(solves[team]).reduce(
            (
              obj: { [challengeId: string]: { points: number; time: number } },
              [challengeId]
            ) => {
              obj[challengeId] = {
                points: computeScore(challengeSolvesAmount[challengeId]),
                time: solves[team][challengeId]
              }
              return obj
            },
            {}
          )

          const lastAccept = Math.max(...Object.values(solves[team]))

          const score = Object.values(taskStats).reduce(
            (total, { points }) => total + points,
            0
          )

          const teamName = (await database.teams.get(team)).name

          return { team: teamName, score, taskStats, lastAccept }
        })
      )

      temporaryStandings.sort(
        (teamA, teamB) =>
          teamA.score - teamB.score || teamA.lastAccept - teamB.lastAccept
      )

      const standings: Standing[] = temporaryStandings.map((item, index) => ({
        ...item,
        pos: index + 1
      }))

      const score: Score = { tasks, standings } as Score

      res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')

      res.status(200).json(score)
    } catch (err) {
      next(err)
    }
  })

  return router
}
