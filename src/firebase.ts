import { Database, Challenge, Solves } from './app'
import admin, {FirebaseError} from 'firebase-admin'
import firebase from 'firebase'
import { firebaseConfig } from '../constants.json'
import { SemanticError, NotFoundError, AuthorizationError } from './types/errors.type'

const resolveFirebaseError = (err: FirebaseError) => {
  switch (err.code) {
    case 'auth/email-already-exists':
    case 'auth/email-already-in-use':
    case 'auth/invalid-argument':
    case 'auth/invalid-display-name':
    case 'auth/invalid-email':
    case 'auth/invalid-password':
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
  authAdmin: admin.auth.Auth,
  auth: firebase.auth.Auth
): Database => ({
  teams: {
    register: async ({ name, countries, members }) => {
      const currentTeam = (
        await firestore
          .collection('team_members')
          .doc(members[0])
          .get()
      ).data()

      if (currentTeam) {
        throw new SemanticError('you are already part of a team')
      }

      await firestore
        .collection('team_members')
        .doc(members[0])
        .set({
          team: name
        })

      const data = await firestore.collection('teams').add({
        name,
        countries,
        members
      })
      return { id: data.id, name, countries, members }
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
    }
  },
  users: {
    get: async (id: string) => {
      // const data = await firestore.collection('users').doc(id)
      return { id }
    },
    register: async ({ email, password, displayName }) => {
      try {
        const userCredentials = await auth.createUserWithEmailAndPassword(
          email,
          password
        )

        if (!userCredentials.user) {
          throw new Error('Empty user')
        }

        await userCredentials.user.updateProfile({ displayName })
        await userCredentials.user.sendEmailVerification()

        return { uuid: userCredentials.user.uid, email, displayName }
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    current: async token => {
      try {
        const tokenData = await authAdmin.verifyIdToken(token)

        const user = await authAdmin.getUser(tokenData.uid)
        return {
          uuid: tokenData.uid,
          email: user.email!,
          displayName: user.displayName!
        }
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    login: async ({ email, password }) => {
      try {
        const { user } = await auth.signInWithEmailAndPassword(email, password)

        if (!user) {
          throw new NotFoundError("Users don't exists")
        }

        if (!user.emailVerified) {
          throw new AuthorizationError('Email not verified')
        }

        const token = await user.getIdToken()
        const data = {
          uuid: user.uid,
          email: user.email || email,
          displayName: user.displayName || ''
        }
        return { user: data, token, refreshToken: user.refreshToken }
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    }
  },
  challenges: {
    all: async () => {
      const getChallenges = async () => (await firestore
        .collection('challenges').get()).docs.reduce((obj: {[challengeId: string]: Challenge}, doc) => {
        obj[doc.id] = doc.data() as Challenge
        return obj
      }, {})

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
        throw new (resolveFirebaseError(err))(err.message)
      }
    }
  },
  solves: {
    all: async () => {
      const getSolves = async () => (await firestore
        .collection('solves').get()).docs.reduce((obj:{[teamId:string]:Solves}, doc) => {
        obj[doc.id] = doc.data()
        return obj
      }, {})

      try {
        return await getSolves()
      } catch (err) {
        throw new (resolveFirebaseError(err))(err.message)
      }
    },
    register: async (teamId, challengeId) => {
      try {
        const timestamp = new Date().getTime()

        await firestore
          .collection('solves')
          .doc(teamId)
          .set({ [challengeId]: timestamp })

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
        throw new (resolveFirebaseError(err))(err.message)
      }
    }
  }
})



export function init({credential, databaseURL}:{credential: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}, databaseURL:string}){

const firebaseAdminInstance = admin.initializeApp({
  credential: admin.credential.cert(credential),
  databaseURL
})
const authAdmin = firebaseAdminInstance.auth()
const firestore = firebaseAdminInstance.firestore()

const firebaseInstance = firebase.initializeApp(firebaseConfig)
const auth = firebaseInstance.auth()
  const database = prepareDatabase(firestore, authAdmin, auth)
  return database
}
