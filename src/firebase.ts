import { Database, Team, Challenge, Solve } from './app'
import admin, { credential } from 'firebase-admin'
import firebase from 'firebase'

const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: ''
}

const firebaseAdminInstance = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://test-pwn2win.firebaseio.com'
})
const authAdmin = firebaseAdminInstance.auth()
const firestore = firebaseAdminInstance.firestore()

const firebaseInstance = firebase.initializeApp(config)
const auth = firebaseInstance.auth()

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
        throw new Error('you are already part of a team')
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
        throw new Error('Not found')
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
    },
    current: async token => {
      const tokenData = await authAdmin.verifyIdToken(token)

      const user = await authAdmin.getUser(tokenData.uid)
      return {
        uuid: tokenData.uid,
        email: user.email!,
        displayName: user.displayName!
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
      ).data()

      if (!data) {
        throw new Error('Not found')
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

const database = prepareDatabase(firestore, authAdmin, auth)

export default database
