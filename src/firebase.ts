import { Database, Team, Challenge, Solve } from './app'
import firebase from 'firebase'

const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: ''
}

const firebaseInstance = firebase.initializeApp(config)
const firestore = firebaseInstance.firestore()
const auth = firebaseInstance.auth()

const prepareDatabase = (
  firestore: firebase.firestore.Firestore,
  auth: firebase.auth.Auth
): Database => ({
  teams: {
    register: async ({ name, countries }) => {
      const data = await firestore.collection('teams').add({
        name,
        countries
      })
      return { id: data.id, name, countries }
    },
    get: async id => {
      const data = (
        await firestore
          .collection('teams')
          .doc(id)
          .get()
      ).data

      if (!data) {
        throw new Error('Not found')
      }

      // TODO: implement
      const team = {} as Team
      return team
    }
  },
  users: {
    get: async (id: string) => {
      // const data = await firestore.collection('users').doc(id)
      return { id }
    },
    register: async ({ email, password, displayName }) => {
      const data = await auth.createUserWithEmailAndPassword(email, password)

      if (data.user) {
        await data.user.updateProfile({ displayName })
        return { uuid: data.user.uid, email, displayName }
      } else {
        console.warn('Empty user:', data)
        throw new Error('Empty user:' + data)
      }
    },
    login: async ({ email, password }) => {
      const { user } = await auth.signInWithEmailAndPassword(email, password)

      if (!user) {
        throw new Error("Users don't exists")
      }

      if (!user.emailVerified) {
        throw new Error('Email not verified')
      }

      const token = await user.getIdToken()
      const data = {
        uuid: user.uid,
        email: user.email || email,
        displayName: user.displayName || ''
      }
      return { user: data, token, refreshToken: user.refreshToken }
    }
  },
  challenges: {
    get: async id => {
      const data = (
        await firestore
          .collection('challenges')
          .doc(id)
          .get()
      ).data

      if (!data) {
        throw new Error('Not found')
      }

      // TODO: implement
      const challenge = {} as Challenge
      return challenge
    }
  },
  solves: {
    register: async (teamId, challengeId) => {
      const timestamp = new Date().getMilliseconds()

      await firestore
        .collection('solves')
        .doc(teamId)
        .set({ [challengeId]: timestamp })

      return { [challengeId]: timestamp }
    },
    get: async id => {
      const data = (
        await firestore
          .collection('solves')
          .doc(id)
          .get()
      ).data

      if (!data) {
        throw new Error('Not found')
      }

      // TODO: implement
      const solves = {} as Solve
      return solves
    }
  }
})

const database = prepareDatabase(firestore, auth)

export default database
