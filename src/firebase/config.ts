import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDU5CosMQJNPKSBbLwpHgkllLN2BgPXhnE",
    authDomain: "vihayacourse.firebaseapp.com",
    projectId: "vihayacourse",
    storageBucket: "vihayacourse.firebasestorage.app",
    messagingSenderId: "759750253488",
    appId: "1:759750253488:web:a8c10fed576ec165165475",
    measurementId: "G-T94MXM7BXF"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app; 