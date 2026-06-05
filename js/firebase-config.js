import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB7ZuFY7f6ylGBgZFq5W32SoX3J7or20lA",
  authDomain: "lesmuses-4db89.firebaseapp.com",
  projectId: "lesmuses-4db89",
  storageBucket: "lesmuses-4db89.firebasestorage.app",
  messagingSenderId: "102976145981",
  appId: "1:102976145981:web:8f1db49e49fcbb9d9df854"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);