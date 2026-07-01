import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

import { getStorage } from "firebase/storage";

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging (conditionally — only in supported browsers)
export const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(app);
    }
    console.warn("Firebase Messaging is not supported in this browser.");
    return null;
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
    return null;
  }
};

export default app;
