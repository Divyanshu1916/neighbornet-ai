import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBacHpZ-_14wZxwh3L-7AOzSmdC2Apvcqk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "neighbornetai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "neighbornetai",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:436275452266:web:fe68f12a0948a2e87b2d13",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "436275452266",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "neighbornetai.firebasestorage.app",
};

export const firebaseConfigured = true;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebase() {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  }
  return { app: _app, auth: _auth, db: _db };
}

export const googleProvider = new GoogleAuthProvider();
