import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEFFSzXFYLPPdBzJQDEpQHEoEKKud411k",
  authDomain: "chinos-cafe.firebaseapp.com",
  databaseURL: "https://chinos-cafe-default-rtdb.firebaseio.com",
  projectId: "chinos-cafe",
  storageBucket: "chinos-cafe.firebasestorage.app",
  messagingSenderId: "1063469163215",
  appId: "1:1063469163215:web:364c2e1f580257efae8dba"
};

const app = initializeApp(firebaseConfig);

// Base de datos 1: Firestore (NoSQL documental)
export const db = getFirestore(app);

// Base de datos 2: Realtime Database (NoSQL en tiempo real = replicación)
export const rtdb = getDatabase(app);
