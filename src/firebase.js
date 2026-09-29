import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJxDKB7fcX_Id0n911uIAYbaxPTWey30w",
  authDomain: "finanzas-personales-c08d7.firebaseapp.com",
  projectId: "finanzas-personales-c08d7",
  storageBucket: "finanzas-personales-c08d7.firebasestorage.app",
  messagingSenderId: "360007441768",
  appId: "1:360007441768:web:e088f21ef141a340d1cadd",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);