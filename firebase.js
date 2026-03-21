// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDGLOQJR2p_6b-axob2h-zIQIhGngo3r3E",
  authDomain: "smallbizdashboard.firebaseapp.com",
  projectId: "smallbizdashboard",
  storageBucket: "smallbizdashboard.firebasestorage.app",
  messagingSenderId: "943371977812",
  appId: "1:943371977812:web:c69a0316491e303b2499c1",
  measurementId: "G-DCC4PC4RN2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;