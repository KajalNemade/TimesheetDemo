// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyA2HlFuDiewcUoLmkhUW5EWH0JZp8VHHTc",
//   authDomain: "timesheet-5ff43.firebaseapp.com",
//   projectId: "timesheet-5ff43",
//   storageBucket: "timesheet-5ff43.firebasestorage.app",
//   messagingSenderId: "306025857312",
//   appId: "1:306025857312:web:76a842a84e0866c18f5745",
//   measurementId: "G-GDP8JS49YD"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);



import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2HlFuDiewcUoLmkhUW5EWH0JZp8VHHTc",
  authDomain: "timesheet-5ff43.firebaseapp.com",
  projectId: "timesheet-5ff43",
  storageBucket: "timesheet-5ff43.firebasestorage.app",
  messagingSenderId: "306025857312",
  appId: "1:306025857312:web:76a842a84e0866c18f5745",
  measurementId: "G-GDP8JS49YD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
