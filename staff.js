import { auth, db } from './common.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, doc, onSnapshot, query, where, orderBy, updateDoc, writeBatch, getDocs, limit, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Page Protection and Initialization
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            window.location.href = './admin.html';
        } else {
            initializeStaffDashboard(user, userDoc.exists() ? userDoc.data() : { email: user.email });
        }
    } else {
        window.location.href = './index.html';
    }
});

const initializeStaffDashboard = (user, userData) => {
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    
    // View navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            views.forEach(v => v.classList.add('hidden'));
            document.getElementById(btn.dataset.view)?.classList.remove('hidden');
        });
    });

    // --- My Tasks Logic ---
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid), orderBy('deadline', 'asc'));
    onSnapshot(q, snapshot => { /* ... load staff tasks ... */ });

    // --- Notifications Logic ---
    setupNotifications(user);
    
    // --- Attendance Logic ---
    document.querySelector('[data-view="staff-attendance-view"]').addEventListener('click', () => setupAttendancePage(user));
};

// --- GLOBAL LOGOUT LISTENER (MORE ROBUST) ---
document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'logout-btn') {
        signOut(auth);
    }
});

// ... (All other staff helper functions from the previous complete version: renderTaskItem, setupNotifications, setupAttendancePage, etc.)
