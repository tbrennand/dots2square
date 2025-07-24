// Firebase initialization
import { initializeApp } from 'firebase/app'
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth'
import { firebaseConfig } from './config'

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)
const db: Firestore = getFirestore(firebaseApp)
const auth: Auth = getAuth(firebaseApp)

// Connect to emulators in development
// if (import.meta.env.DEV) {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080)
//     connectAuthEmulator(auth, 'http://localhost:9099')
//     console.log('✅ Connected to Firebase Emulators')
//   } catch (error) {
//     console.warn('⚠️ Firebase Emulators already connected or not available')
//   }
// }

export { firebaseApp, db, auth } 