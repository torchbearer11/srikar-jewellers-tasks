import { auth, db } from './common.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const loginButton = document.getElementById('login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// Redirect if already logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'staff';
        window.location.href = (role === 'admin') ? './admin.html' : './staff.html';
    }
});

// Handle login button click
loginButton.addEventListener('click', async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'staff';
        window.location.href = (role === 'admin') ? './admin.html' : './staff.html';
    } catch (error) {
        loginError.textContent = 'Invalid email or password.';
    }
});
