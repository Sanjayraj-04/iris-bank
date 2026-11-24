import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVfXndw-WuNsx05EFGxddafy6CWFQXROM",
  authDomain: "irisbank-bae77.firebaseapp.com",
  projectId: "irisbank-bae77",
  storageBucket: "irisbank-bae77.firebasestorage.app",
  messagingSenderId: "891877905945",
  appId: "1:891877905945:web:345d11aa1e665dc0103c88",
  measurementId: "G-2S1ESP24SP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
