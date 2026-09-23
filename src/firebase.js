import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJxDKB7fcX_Id0n911uIAYbaxPTWey30w",
  authDomain: "finanzas-personales-c08d7.firebaseapp.com",
  projectId: "finanzas-personales-c08d7",
  storageBucket: "finanzas-personales-c08d7.firebasestorage.app",
  messagingSenderId: "360007441768",
  appId: "1:360007441768:web:e088f21ef141a340d1cadd",
  measurementId: "G-MNYE91Z4W6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);