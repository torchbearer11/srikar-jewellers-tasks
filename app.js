// --- 1. INITIALIZE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL STATE & ELEMENTS ---
let currentUser = null;
let currentUserRole = 'staff';
const loginPage = document.getElementById('login-page');
const appPage = document.getElementById('app-page');
const loginButton = document.getElementById('login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// --- PAGE NAVIGATION ---
const showView = (viewId) => {
    appPage.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        currentUserRole = userDoc.exists() ? (userDoc.data().role || 'staff') : 'staff';
        loginPage.classList.remove('active');
        appPage.classList.add('active');
        setupDashboard();
        checkAndCreateRecurringTasks();
    } else {
        currentUser = null;
        loginPage.classList.add('active');
        appPage.classList.remove('active');
    }
});

loginButton.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value)
        .catch(() => loginError.textContent = 'Invalid email or password.');
});
const logout = () => signOut(auth);

// --- DASHBOARD SETUP ---
const setupDashboard = () => {
    const headerNav = document.getElementById('header-nav');
    const headerSubtitle = document.getElementById('header-subtitle');
    headerNav.innerHTML = '';
    
    if (currentUserRole === 'admin') {
        document.getElementById('header-title').textContent = "Admin Dashboard";
        headerSubtitle.textContent = "Srikar Jewellers - Management";
        headerNav.innerHTML = `
            <button class="btn nav-btn active" data-view="admin-dashboard-view">Dashboard</button>
            <button class="btn nav-btn" data-view="admin-performance-view">Performance</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>`;
        showView('admin-dashboard-view');
        initializeAdminDashboard();
    } else {
        document.getElementById('header-title').textContent = "Staff Dashboard";
        headerSubtitle.textContent = `Welcome, ${currentUser.displayName || currentUser.email}`;
        headerNav.innerHTML = `
            <button class="btn nav-btn active" data-view="staff-dashboard-view">My Tasks</button>
            <button class="btn nav-btn" data-view="staff-attendance-view">Attendance</button>
            <div id="notification-bell-container"></div>
            <button id="logout-btn" class="btn btn-danger">Logout</button>`;
        showView('staff-dashboard-view');
        initializeStaffDashboard();
    }
    
    headerNav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            headerNav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showView(e.target.dataset.view);
        });
    });
    headerNav.querySelector('#logout-btn').addEventListener('click', logout);
};

// --- ADMIN FEATURES ---
const initializeAdminDashboard = () => {
    const assignTaskButton = document.getElementById('assign-task-button');
    assignTaskButton.addEventListener('click', async () => {
        const task = {
            title: document.getElementById('task-title').value,
            assignedToUID: document.getElementById('task-assignee').value,
            priority: document.getElementById('task-priority').value,
            deadline: Timestamp.fromDate(new Date(document.getElementById('task-deadline').value)),
            isRecurring: document.getElementById('task-recurring').checked,
            status: 'Pending',
            createdAt: serverTimestamp()
        };
        if (!task.title || !task.assignedToUID) return alert('Title and Assignee are required.');
        
        const taskRef = await addDoc(collection(db, 'tasks'), task);
        
        await addDoc(collection(db, 'users', task.assignedToUID, 'notifications'), {
            message: `New task assigned: "${task.title}"`,
            isRead: false,
            createdAt: serverTimestamp()
        });
        alert('Task assigned!');
        document.getElementById('assign-task-form').reset();
    });

    onSnapshot(collection(db, 'users'), snapshot => { /* ... populate staff dropdown ... */ });
    onSnapshot(query(collection(db, 'tasks'), where('status', '!=', 'Completed')), snapshot => { /* ... load admin tasks ... */ });
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
};

// --- STAFF FEATURES ---
const initializeStaffDashboard = () => {
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', currentUser.uid), orderBy('deadline', 'asc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = '';
        snapshot.docs.forEach(doc => renderTaskItem(staffTaskList, { id: doc.id, ...doc.data() }));
    });
    
    setupNotifications();
    document.querySelector('[data-view="staff-attendance-view"]').addEventListener('click', setupAttendancePage);
};

// --- TASK RENDERING & STATUS UPDATE ---
const renderTaskItem = (container, task) => {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const statusOptions = ['Pending', 'Started', 'In Progress', 'Completed'];
    
    let actionsHtml = (currentUserRole === 'staff')
        ? `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`
        : `<span class="role">${task.status}</span>`;

    item.innerHTML = `<div><div class="task-title">${task.title}</div><small>Deadline: ${task.deadline.toDate().toLocaleString('en-IN')}</small></div><div>${actionsHtml}</div>`;
    container.appendChild(item);

    if (currentUserRole === 'staff') {
        item.querySelector('.task-status-selector').addEventListener('change', e => {
            const newStatus = e.target.value;
            const taskRef = doc(db, 'tasks', task.id);
            const updateData = { status: newStatus };
            if (newStatus === 'Started' && !task.startedAt) updateData.startedAt = serverTimestamp();
            if (newStatus === 'Completed' && !task.completedAt) updateData.completedAt = serverTimestamp();
            updateDoc(taskRef, updateData);
        });
    }
};

// --- NOTIFICATIONS ---
const setupNotifications = () => { /* ... notification logic from previous response ... */ };

// --- ATTENDANCE ---
const setupAttendancePage = () => {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', currentUser.uid, 'attendance', today);
    // ... all clock in/out button logic here that calls setDoc(attendanceDocRef, { ... }, { merge: true }) ...
};

// --- RECURRING TASKS ---
const checkAndCreateRecurringTasks = async () => {
    const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck === today) return; // Only run once per day

    const q = query(collection(db, 'tasks'), where('isRecurring', '==', true));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.forEach(doc => {
        const task = doc.data();
        const deadline = task.deadline.toDate();
        deadline.setDate(deadline.getDate() + 1); // Set deadline for tomorrow
        
        const newTask = { ...task, deadline: Timestamp.fromDate(deadline), status: 'Pending', createdAt: serverTimestamp() };
        delete newTask.startedAt;
        delete newTask.completedAt;
        
        batch.set(doc(collection(db, 'tasks')), newTask);
    });
    
    await batch.commit();
    localStorage.setItem('lastRecurringTaskCheck', today);
};


// --- PERFORMANCE DASHBOARD (ADMIN) ---
const renderPerformanceDashboard = async () => {
    const container = document.getElementById('performance-table-container');
    container.innerHTML = `<p>Calculating performance metrics...</p>`;
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
    const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
    const completedTasks = tasksSnapshot.docs.map(doc => doc.data());

    const performanceData = usersSnapshot.docs.map(doc => {
        const user = doc.data();
        const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid);
        const completionTimes = userTasks
            .map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000) // in hours
            .filter(t => t > 0);
        
        const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
        
        // Simplified scoring
        const score = (userTasks.length * 10) - avgCompletionHours;
        
        return {
            name: user.name || user.email,
            tasksCompleted: userTasks.length,
            avgTime: avgCompletionHours.toFixed(2),
            score
        };
    });

    performanceData.sort((a, b) => b.score - a.score); // Rank by score

    container.innerHTML = `
        <table class="performance-table">
            <thead><tr><th>Rank</th><th>Staff Name</th><th>Tasks Completed</th><th>Avg. Completion (Hours)</th></tr></thead>
            <tbody>
                ${performanceData.map((p, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.tasksCompleted}</td>
                        <td>${p.avgTime}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
};

// ... (Fill in the stubbed/shortened functions with the full logic)
