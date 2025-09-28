// src/firebase/config.jsx

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDe7uCMkEwgGXtsG9g_VSivX6wNwBFwT10",
  authDomain: "jomach-f6258.web.app",
  projectId: "jomach-f6258",
  storageBucket: "jomach-f6258.firebasestorage.app",
  messagingSenderId: "232881354767",
  appId: "1:232881354767:web:1edfc1dece5d736dbacb7a",
  measurementId: "G-KV3NHF3QX5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);   // 👈 initialize auth
const storage = getStorage(app);

// Export what you need
export { db, auth, analytics, storage };
