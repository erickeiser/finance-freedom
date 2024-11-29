import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9a7ga7U8RUCgCmKCCgrS-gzvIvjvNVes",
  authDomain: "paycheckplanner-5f8fd.firebaseapp.com",
  projectId: "paycheckplanner-5f8fd",
  storageBucket: "paycheckplanner-5f8fd.firebasestorage.app",
  messagingSenderId: "812182095029",
  appId: "1:812182095029:web:227a6451844514b349aafc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };