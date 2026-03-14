import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxXjlWKdRDLG48_MzCgbUxJnQRxb1l09g",
  authDomain: "swingers-golf.firebaseapp.com",
  projectId: "swingers-golf",
  storageBucket: "swingers-golf.firebasestorage.app",
  messagingSenderId: "396910778885",
  appId: "1:396910778885:web:15855adb99457de0c29a6c",
  measurementId: "G-528N10W8MV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
