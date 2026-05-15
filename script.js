const findoutmore = document.getElementById('findoutmore');
const gotoCOFEC = document.getElementById('cofecbtn');

if (findoutmore) {
    findoutmore.addEventListener('click', gotoContact);
}

if (gotoCOFEC) {
    gotoCOFEC.addEventListener('click', gotoCOFECSite);
}

function gotoContact() {
    window.location.href = 'contact.html';
}

function gotoCOFECSite() {
    window.location.assign('https://cofec.org');
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, getIdTokenResult, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBK5RX5qMHDT-bzdC4--8MHnl-VlVo6w5U",
  authDomain: "holy-trinity-frinton.firebaseapp.com",
  projectId: "holy-trinity-frinton",
  storageBucket: "holy-trinity-frinton.firebasestorage.app",
  messagingSenderId: "924076294440",
  appId: "1:924076294440:web:2f995c2e6f09d303fa501d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();


document.getElementById('signInBtn').addEventListener('click', async ()=>{
  const status = document.getElementById('authStatus');
  status.textContent = 'Opening Google sign-in...';
  try {
    await signInWithPopup(auth, provider);
    status.textContent = 'Signed in successfully.';
  } catch (error) {
    console.error(error);
    status.textContent = `Sign-in failed: ${error.code || ''} ${error.message || error}`.trim();
  }
});
document.getElementById('signOutBtn').addEventListener('click', async ()=>{
  await signOut(auth);
  document.getElementById('authStatus').textContent = 'Signed out.';
});

onAuthStateChanged(auth, user=>{
  document.getElementById('signedIn').style.display = user ? 'block' : 'none';
  document.getElementById('signedOut').style.display = user ? 'none' : 'block';
  if (user){
    document.getElementById('who').textContent = user.displayName || user.email;
    if (user.photoURL) document.getElementById('userPhoto').src = user.photoURL;
  }
});