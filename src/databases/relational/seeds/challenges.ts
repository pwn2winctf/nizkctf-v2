import fetch from 'node-fetch'
import { Knex } from 'knex'

import { Challenge } from '../../../app'
import { APP_ENV } from '../../../config'

const CHALLENGES_BASE_URL = APP_ENV === 'production' ? 'https://pwn2winctf.github.io/nizkctf-content/challenges' : 'https://ctf-br.github.io/ranking/challenges'

export const getChallenges = async (): Promise<Challenge[]> => {
  const challengesId: string[] = await getChallengesId()

  const challenges = await Promise.all(challengesId.map(challengeId => getChallengeInfo(challengeId)))

  return challenges
}

export const getChallengesId = async (): Promise<string[]> => {
  const challengesId: string[] = await fetch(CHALLENGES_BASE_URL).then(response => response.json())

  return challengesId
}

export const getChallengeInfo = async (challengeId: string): Promise<Challenge> => {
  const urlChallengeJSON = `${CHALLENGES_BASE_URL}/${challengeId}.json`

  const fetchMetadata: { description: string, title: string, tags: string[], salt: string, pk: string, id: string, opslimit: number, memlimit: number } = await fetch(urlChallengeJSON).then(response => response.json())

  const { salt, title, pk, id, opslimit, memlimit } = fetchMetadata

  return { name: title, salt, pk, id, opslimit, memlimit }
}

export async function seed (knex: Knex): Promise<void> {
  const challenges = await getChallenges()

  await knex('challenges').insert(challenges).onConflict('id').merge()
}
