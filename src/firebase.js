// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCNEiTcEhoVgUnuwnuaDosdEQJL06mCcMs',
  authDomain: 'webrtc-4689a.firebaseapp.com',
  projectId: 'webrtc-4689a',
  storageBucket: 'webrtc-4689a.appspot.com',
  messagingSenderId: '206908323798',
  appId: '1:206908323798:web:a87105d93047bf360a9677',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
