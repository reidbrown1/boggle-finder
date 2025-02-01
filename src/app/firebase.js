import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCITk5eRZpQcOMZvWZWs2VQt-jVEhKTUPU",
  authDomain: "boggle-finder.firebaseapp.com",
  projectId: "boggle-finder",
  storageBucket: "boggle-finder.firebasestorage.app",
  messagingSenderId: "925321313277",
  appId: "1:925321313277:web:869ee031dc0857f04b3794",
  measurementId: "G-QRJ7W695FH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with phone number configuration
const auth = getAuth(app);
auth.settings.appVerificationDisabledForTesting = false;

// Initialize Firestore
const db = getFirestore(app);

// Set auth persistence and domain
auth.useDeviceLanguage();

// Initialize Analytics
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { auth, db }; 