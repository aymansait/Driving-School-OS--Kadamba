// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9sPBuJBNHbptkaPuToy9yDmFDVcdrcuM",
  authDomain: "kadamba-driving-school.firebaseapp.com",
  projectId: "kadamba-driving-school",
  storageBucket: "kadamba-driving-school.firebasestorage.app",
  messagingSenderId: "1034623194443",
  appId: "1:1034623194443:web:22a41156fca18997e084ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

window.db = db;

alert("✅ Firebase Connected");