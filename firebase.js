// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwEfElaOmSoG_9V29EZ1b2sxWIzfoE8o0",
  authDomain: "ejemplo-1559b.firebaseapp.com",
  databaseURL: "https://ejemplo-1559b-default-rtdb.firebaseio.com",
  projectId: "ejemplo-1559b",
  storageBucket: "ejemplo-1559b.appspot.com",
  messagingSenderId: "1002247862442",
  appId: "1:1002247862442:web:e1a8e9616d920766a5b8d3",
  measurementId: "G-NPC3G30CV3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);