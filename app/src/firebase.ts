import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBJygBzEZNDnRaTyHcW5ql4oRYrGXXjG7s',
  authDomain: 'forest-merge-2048.firebaseapp.com',
  projectId: 'forest-merge-2048',
  storageBucket: 'forest-merge-2048.firebasestorage.app',
  messagingSenderId: '872962764849',
  appId: '1:872962764849:web:d53d21042cc4fdf8d7e510',
  measurementId: 'G-EL4H6H0V9H',
} as const;

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  const existing = getApps();
  firebaseApp = existing.length ? existing[0] : initializeApp(FIREBASE_CONFIG);
  return firebaseApp;
}
