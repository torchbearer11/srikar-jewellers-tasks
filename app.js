// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
    authDomain: "srikar-jewellers-crm.firebaseapp.com",
    projectId: "srikar-jewellers-crm",
    storageBucket: "srikar-jewellers-crm.firebasestorage.app",
    messagingSenderId: "377625912262",
    appId: "1:377625912262:web:d6d05bec0d817e211b48c7",
    measurementId: "G-06K93QM4V4"
};

// --- INITIALIZE SERVICES ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL STATE ---
let currentUser = null;
let currentUserRole = 'staff';

// --- UI ELEMENTS ---
const loginPage = document.getElementById('login-page');
const appPage = document.getElementById('app-page');
const loginButton = document.getElementById('login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const headerNav = document.getElementById('header-nav');
const appMain = document.getElementById('app-main');

// --- PAGE NAVIGATION ---
const showView = (viewId) => {
    appMain.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentUserRole = userDoc.data().role || 'staff';
        }
        loginPage.classList.remove('active');
        appPage.classList.add('active');
        setupDashboard();
    } else {
        currentUser = null;
        currentUserRole = 'staff';
        loginPage.classList.add('active');
        appPage.classList.remove('active');
    }
});

loginButton.addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value);
    } catch (error) {
        loginError.textContent = "Invalid email or password.";
    }
});

const logout = () => signOut(auth);

// --- DASHBOARD SETUP ---
const setupDashboard = () => {
    headerNav.innerHTML = '';
    if (currentUserRole === 'admin') {
        // Setup Admin Dashboard
        document.getElementById('header-title').textContent = "Admin Dashboard";
        headerNav.innerHTML = `
            <button class="btn nav-btn active" data-view="admin-dashboard-view">Dashboard</button>
            <button class="btn nav-btn" data-view="admin-create-staff-view">Manage Staff</button>
            <button class="btn nav-btn" data-view="admin-assign-task-view">Assign Task</button>
            <button id="logout-btn-admin" class="btn btn-danger">Logout</button>
        `;
        showView('admin-dashboard-view');
        initializeAdminDashboard();
    } else {
        // Setup Staff Dashboard
        document.getElementById('header-title').textContent = "Staff Dashboard";
        headerNav.innerHTML = `
             <button class="btn nav-btn active" data-view="staff-dashboard-view">My Dashboard</button>
             <button id="logout-btn-staff" class="btn btn-danger">Logout</button>
        `;
        showView('staff-dashboard-view');
        initializeStaffDashboard();
    }

    // Universal nav logic
    headerNav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            headerNav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showView(e.target.dataset.view);
        });
    });
    document.getElementById('logout-btn-admin')?.addEventListener('click', logout);
    document.getElementById('logout-btn-staff')?.addEventListener('click', logout);
};


// --- ADMIN FEATURES ---
const initializeAdminDashboard = () => {
    // Stat Listeners
    onSnapshot(collection(db, 'users'), snapshot => {
        document.getElementById('stat-total-staff').textContent = snapshot.size;
    });
    const tasksQuery = query(collection(db, 'tasks'));
    onSnapshot(tasksQuery, snapshot => {
        const tasks = snapshot.docs.map(d => d.data());
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('stat-active-tasks').textContent = tasks.filter(t => t.status !== 'completed').length;
        document.getElementById('stat-pending-tasks').textContent = tasks.filter(t => t.status === 'pending').length;
        document.getElementById('stat-completed-today').textContent = tasks.filter(t => t.completedAt?.toDate().toISOString().startsWith(today)).length;
    });

    // Task List Listener
    const adminTaskList = document.getElementById('admin-task-list');
    onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), snapshot => {
        adminTaskList.innerHTML = snapshot.empty ? '<p>No tasks assigned yet.</p>' : '';
        snapshot.forEach(doc => renderTaskItem(adminTaskList, doc.data(), 'admin'));
    });

    // Manage Staff View Listeners
    const createStaffButton = document.getElementById('create-staff-button');
    const createStaffForm = document.getElementById('create-staff-form');
    createStaffButton.onclick = async () => {
        try {
            const { email, password, username, name, phone } = Object.fromEntries(new FormData(createStaffForm));
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name, username, email, phone,
                role: 'staff',
                isActive: true,
                createdAt: serverTimestamp()
            });
            alert(`Staff account for ${name} created successfully!`);
            createStaffForm.reset();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    const staffList = document.getElementById('staff-list');
    onSnapshot(query(collection(db, 'users'), where('role', '==', 'staff')), snapshot => {
        staffList.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const item = document.createElement('div');
            item.className = 'staff-item';
            item.innerHTML = `
                <span>${user.name} (${user.email})</span>
                <span class="role">${user.isActive ? 'Active' : 'Inactive'}</span>
                <button class="btn btn-secondary">${user.isActive ? 'Deactivate' : 'Activate'}</button>
            `;
            item.querySelector('button').onclick = () => setDoc(doc.ref, { isActive: !user.isActive }, { merge: true });
            staffList.appendChild(item);
        });
    });

    // Assign Task View
    const assigneeSelect = document.getElementById('task-assignee');
    onSnapshot(query(collection(db, 'users'), where('isActive', '==', true)), snapshot => {
        assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            const user = doc.data();
            assigneeSelect.innerHTML += `<option value="${user.uid}">${user.name}</option>`;
        });
    });

    const assignTaskButton = document.getElementById('assign-task-button');
    assignTaskButton.onclick = async () => {
        const task = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignedToUID: document.getElementById('task-assignee').value,
            priority: document.getElementById('task-priority').value,
            deadline: Timestamp.fromDate(new Date(document.getElementById('task-deadline').value)),
            status: 'pending',
            createdAt: serverTimestamp()
        };
        if (!task.title || !task.assignedToUID || !task.deadline) {
            alert('Please fill all required fields.');
            return;
        }
        await addDoc(collection(db, 'tasks'), task);
        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
    };
};


// --- STAFF FEATURES ---
const initializeStaffDashboard = () => {
    // My Tasks List
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', currentUser.uid), orderBy('deadline', 'asc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
        snapshot.forEach(doc => renderTaskItem(staffTaskList, doc.data(), 'staff', doc.id));
    });

    // Attendance Logic
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', currentUser.uid, 'attendance', today);
    const clockInBtn = document.getElementById('clock-in-btn');
    const clockOutBtn = document.getElementById('clock-out-btn');
    const lunchOutBtn = document.getElementById('lunch-out-btn');
    const lunchInBtn = document.getElementById('lunch-in-btn');
    const statusDiv = document.getElementById('attendance-status');

    clockInBtn.onclick = () => setDoc(attendanceDocRef, { clockIn: serverTimestamp() }, { merge: true });
    clockOutBtn.onclick = () => setDoc(attendanceDocRef, { clockOut: serverTimestamp() }, { merge: true });
    lunchOutBtn.onclick = () => setDoc(attendanceDocRef, { lunchOut: serverTimestamp() }, { merge: true });
    lunchInBtn.onclick = () => setDoc(attendanceDocRef, { lunchIn: serverTimestamp() }, { merge: true });

    onSnapshot(attendanceDocRef, (docSnap) => {
        statusDiv.innerHTML = '';
        const data = docSnap.exists() ? docSnap.data() : {};
        
        const format = (ts) => ts ? ts.toDate().toLocaleTimeString('en-IN') : '--';
        statusDiv.innerHTML = `
            <div class="stat-card"><h3>Clock In</h3><span class="stat-number">${format(data.clockIn)}</span></div>
            <div class="stat-card"><h3>Lunch Out</h3><span class="stat-number">${format(data.lunchOut)}</span></div>
            <div class="stat-card"><h3>Lunch In</h3><span class="stat-number">${format(data.lunchIn)}</span></div>
            <div class="stat-card"><h3>Clock Out</h3><span class="stat-number">${format(data.clockOut)}</span></div>
        `;
        
        // Button visibility logic
        clockInBtn.classList.toggle('hidden', data.clockIn);
        clockOutBtn.classList.toggle('hidden', !data.clockIn || data.clockOut);
        lunchOutBtn.classList.toggle('hidden', !data.clockIn || data.lunchOut);
        lunchOutBtn.classList.toggle('disabled', !data.clockIn);
        lunchInBtn.classList.toggle('hidden', !data.lunchOut || data.lunchIn);
    });
};

// --- SHARED RENDER FUNCTIONS ---
const renderTaskItem = (container, task, role, taskId = null) => {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority} ${task.status}`;
    item.innerHTML = `
        <div>
            <div class="task-title">${task.title}</div>
            <div class="task-assignee">Assigned to: ${task.assignedToEmail || '...'}</div>
            <small>Deadline: ${task.deadline.toDate().toLocaleString('en-IN')}</small>
        </div>
        ${role === 'staff' && task.status === 'pending' ?
            `<button class="btn btn-primary">Mark as Complete</button>` :
            `<span class="role">${task.status}</span>`
        }
    `;
    if (role === 'staff' && task.status === 'pending') {
        item.querySelector('button').onclick = async () => {
            await setDoc(doc(db, 'tasks', taskId), { status: 'completed', completedAt: serverTimestamp() }, { merge: true });
        };
    }
    container.appendChild(item);
};
