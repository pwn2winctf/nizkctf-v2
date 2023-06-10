import admin, { FirebaseError } from 'firebase-admin'

import { Database, Challenge, Solves, Team } from '../app'
import {
  SemanticError,
  NotFoundError
} from '../types/errors.type'
import { createSHA256, getUserDataFromJWT } from '../utils'

const resolveFirebaseError = (err: FirebaseError) => {
  switch (err.code) {
    case 'auth/email-already-exists':
    case 'auth/email-already-in-use':
    case 'auth/invalid-argument':
    case 'auth/invalid-display-name':
    case 'auth/invalid-email':
    case 'auth/invalid-password':
    case 'auth/id-token-expired':
      return SemanticError
    case 'auth/user-not-found':
    case 'auth/uid-already-exists':
      return NotFoundError
    default:
      return Error
  }
}

const prepareDatabase = (
  firestore: admin.firestore.Firestore,
  authAdmin: admin.auth.Auth
): Database => ({
  teams: {
    register: async ({ name, countries, members }) => {
      return await firestore.runTransaction(async () => {
        const currentTeam = (
          await firestore
            .collection('team_members')
            .doc(members[0])
            .get()
        ).data()

        if (currentTeam) {
          throw new SemanticError('you are already member of a team')
        }

        const teamId = createSHA256(name)

        const teamData = (await firestore.collection('teams').doc(teamId).get()).data()

        if (teamData) {
          throw new SemanticError('This team already exists')
        }

        await firestore
          .collection('team_members')
          .doc(members[0])
          .set({
            team: name
          })

        await firestore.collection('teams').doc(teamId).set({
          name,
          countries,
          members
        })

        return { id: teamId, name, countries, members }
      })
    },
    get: async id => {
      const data = (
        await firestore
          .collection('teams')
          .doc(id)
          .get()
      ).data()

      if (!data) {
        throw new NotFoundError('Not found')
      }

      const team = {
        id,
        name: data.name,
        countries: data.countries,
        members: data.members
      }
      return team
    },
    list: async () => {
      const data = (
        await firestore
          .collection('teams').get()
      ).docs.map(doc => {
        const docData = doc.data()
        return { id: doc.id, name: docData.name, countries: docData.countries, members: docData.members }
      })

      if (!data) {
        return []
      }

      const teams = data.map(item => ({
        id: item.id,
        name: item.name,
        countries: item.countries
      }))

      return teams
    }
  },
  users: {
    current: async token => {
      try {
        const { uid } = await getUserDataFromJWT(token)

        const user = await authAdmin.getUser(uid)

        if (!user.email || !user.displayName) {
          throw new Error('Invalid user data')
        }

        const currentTeam = (
          await firestore
            .collection('team_members')
            .doc(uid)
            .get()
        ).data()

        if (currentTeam) {
          const doc = (
            await firestore
              .collection('teams').where('name', '==', currentTeam.team).limit(1).get()
          ).docs[0]
          const data = doc.data()

          const team: Omit<Team, 'members'> = {
            id: doc.id,
            name: data.name,
            countries: data.countries
          }

          return {
            uid: uid,
            email: user.email,
            displayName: user.displayName,
            team
          }
        } else {
          return {
            uid: uid,
            email: user.email,
            displayName: user.displayName
          }
        }
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    register: async ({ shareInfo, uid }) => {
      await firestore
        .collection('users')
        .doc(uid)
        .set({ shareInfo })
    }
  },
  challenges: {
    all: async () => {
      const getChallenges = async () =>
        (await firestore.collection('challenges').get()).docs.reduce(
          (obj: { [challengeId: string]: Challenge }, doc) => {
            obj[doc.id] = doc.data() as Challenge
            return obj
          },
          {}
        )

      try {
        return await getChallenges()
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    get: async id => {
      try {
        const data = (
          await firestore
            .collection('challenges')
            .doc(id)
            .get()
        ).data()

        if (!data) {
          throw new NotFoundError('Not found')
        }

        const challenge = {
          id,
          memlimit: data.memlimit,
          name: data.name,
          opslimit: data.opslimit,
          pk: data.pk,
          salt: data.salt
        } as Challenge
        return challenge
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw err
        }
        throw new (resolveFirebaseError(err))(err.message)
      }
    }
  },
  solves: {
    all: async () => {
      const getSolves = async () =>
        (await firestore.collection('solves').get()).docs.reduce(
          (obj: { [teamId: string]: Solves }, doc) => {
            obj[doc.id] = doc.data().timestamp
            return obj
          },
          {}
        )

      try {
        return await getSolves()
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    allWithProof: async () => {
      const getSolves = async () => {
        const solves: Array<{ teamId: string, moment: number, flag: string, challengeId: string }> = []

        const docs = await firestore.collection('solves').get()

        docs.forEach(doc => {
          const items = Object.entries(doc.data())

          items.forEach(([id, item]) => {
            solves.push({ teamId: doc.id, moment: item.timestamp, flag: item.flag, challengeId: id })
          })
        })

        return solves
      }

      try {
        return await getSolves()
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    register: async (teamId, challengeId, flag) => {
      try {
        const timestamp = new Date().getTime()

        await firestore
          .collection('solves')
          .doc(teamId)
          .set({ [challengeId]: { timestamp, flag } })

        return { [challengeId]: timestamp }
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    get: async id => {
      try {
        const data = (
          await firestore
            .collection('solves')
            .doc(id)
            .get()
        ).data

        if (!data) {
          throw new NotFoundError('Not found')
        }

        // TODO: implement
        const solves = {} as Solves
        return solves
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw err
        }
        throw new (resolveFirebaseError(err))(err.message)
      }
    }
  }
})

export function init ({
  credential,
  databaseURL
}: {
  credential: {
    projectId: string
    clientEmail: string
    privateKey: string
  }
  databaseURL: string
}): Database {
  const firebaseAdminInstance = admin.initializeApp({
    credential: admin.credential.cert(credential),
    databaseURL
  })
  const authAdmin = firebaseAdminInstance.auth()
  const firestore = firebaseAdminInstance.firestore()

  const database = prepareDatabase(firestore, authAdmin)
  return database
}
