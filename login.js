import { auth, db } from './common.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const loginButton = document.getElementById('login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// Redirect user if they are already logged in
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
        await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value);
        // The onAuthStateChanged listener above will handle the redirect
    } catch (error) {
        loginError.textContent = 'Invalid email or password.';
    }
});
