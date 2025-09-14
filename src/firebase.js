import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD3pUvO8kDf4oUrRfuvQhoJrvHc74aBrCA",
  authDomain: "printzy-dashboard.firebaseapp.com",
  projectId: "printzy-dashboard",
  storageBucket: "printzy-dashboard.firebasestorage.app",
  messagingSenderId: "673822799770",
  appId: "1:673822799770:web:9a44d5deeab20c2227ec23",
  measurementId: "G-LDW2X50T9T"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
