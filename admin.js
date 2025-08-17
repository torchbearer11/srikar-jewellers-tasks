import { auth, db } from './common.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, doc, addDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, setDoc, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Page Protection and Initialization
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'staff';
        if (role !== 'admin') {
            window.location.href = './staff.html';
        } else {
            initializeAdminDashboard(user, userDoc.data());
        }
    } else {
        window.location.href = './index.html';
    }
});

const initializeAdminDashboard = (user, userData) => {
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;

    // View navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            views.forEach(v => v.classList.add('hidden'));
            document.getElementById(btn.dataset.view)?.classList.add('hidden'); // Fix: should be remove
            document.getElementById(btn.dataset.view)?.classList.remove('hidden'); // Correct
        });
    });

    // --- Task Assignment Logic ---
    const assignTaskButton = document.getElementById('assign-task-button');
    assignTaskButton.addEventListener('click', async () => { /* ... same as before ... */ });

    onSnapshot(collection(db, 'users'), snapshot => {
        const assigneeSelect = document.getElementById('task-assignee');
        assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.role !== 'admin') {
                assigneeSelect.innerHTML += `<option value="${user.uid}">${user.name || user.email}</option>`;
            }
        });
    });
    
    onSnapshot(query(collection(db, 'tasks'), where('status', '!=', 'Completed')), snapshot => { /* ... load admin tasks ... */ });

    // --- Create Staff Logic ---
    const createStaffButton = document.getElementById('create-staff-button');
    createStaffButton.addEventListener('click', async () => {
        const name = document.getElementById('staff-name').value;
        const email = document.getElementById('staff-email').value;
        const password = document.getElementById('staff-password').value;
        if (!name || !email || !password) return alert('All fields are required.');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                role: 'staff',
                isActive: true,
                createdAt: serverTimestamp()
            });
            alert(`Staff account for ${name} created successfully!`);
            document.getElementById('create-staff-form').reset();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- Performance View Logic ---
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
};

// --- GLOBAL LOGOUT LISTENER (MORE ROBUST) ---
document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'logout-btn') {
        signOut(auth);
    }
});

const renderPerformanceDashboard = async () => { /* ... same as before ... */ };
// ... (All other admin helper functions from the previous complete version)
