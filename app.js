import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, limit, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- 1. CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
    authDomain: "srikar-jewellers-crm.firebaseapp.com",
    projectId: "srikar-jewellers-crm",
    storageBucket: "srikar-jewellers-crm.firebasestorage.app",
    messagingSenderId: "377625912262",
    appId: "1:377625912262:web:d6d05bec0d817e211b48c7",
    measurementId: "G-06K93QM4V4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appRoot = document.getElementById('app-root');

// --- 2. HTML TEMPLATES (Now with Admin/Staff management views) ---
const loginTemplate = `
<div class="login-container">
    <div class="login-box">
        <img src="logo.jpeg" alt="Srikar Jewellers Logo" class="logo">
        <h1 class="login-title">Srikar Jewellers</h1><p class="login-subtitle">Staff Portal</p>
        <div class="form-group"><label for="login-email">Email Address</label><input type="email" id="login-email"></div>
        <div class="form-group"><label for="login-password">Password</label><input type="password" id="login-password"></div>
        <button id="login-button" class="btn btn-primary"><i class="fas fa-sign-in-alt"></i> Secure Login</button>
        <p id="login-error"></p>
    </div>
</div>`;

const adminTemplate = (userData) => `
<div class="app-container">
    <div class="main-container">
        <header class="header">
            <div class="header-text"><h1>Admin Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
            <nav id="header-nav">
                <button class="btn nav-btn active" data-view="admin-dashboard-view">Dashboard</button>
                <button class="btn nav-btn" data-view="admin-performance-view">Performance</button>
                <button id="logout-btn" class="btn btn-danger">Logout</button>
            </nav>
        </header>
        <main class="content-area">
            <div id="admin-dashboard-view" class="view active">
                <div class="premium-card">
                    <h2 class="section-title">Assign New Task</h2>
                    <form id="assign-task-form" class="form-grid">
                        <div class="form-group"><label>Task Title</label><input type="text" id="task-title" required></div>
                        <div class="form-group"><label>Assign To</label><select id="task-assignee" required></select></div>
                        <div class="form-group"><label>Priority</label><select id="task-priority"><option value="Important">Important</option><option value="Urgent">Urgent</option><option value="Not Important">Not Important</option></select></div>
                        <div class="form-group"><label>Deadline (Optional)</label><input type="datetime-local" id="task-deadline"></div>
                    </form>
                    <div style="text-align: center; margin-top: 1.5rem;"><button id="assign-task-button" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Assign Task</button></div>
                </div>
                <div class="premium-card"><h2 class="section-title">All Active Tasks</h2><div id="admin-task-list"></div></div>
            </div>
            <div id="admin-performance-view" class="view hidden">
                <div class="premium-card"><h2 class="section-title">Staff Performance & Rankings</h2><div id="performance-table-container"><p>Click to load data...</p></div></div>
            </div>
        </main>
    </div>
</div>`;

const staffTemplate = (userData) => `
<div class="app-container">
    <div class="main-container">
        <header class="header">
            <div class="header-text"><h1>Staff Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
            <nav id="header-nav">
                <button class="btn nav-btn active" data-view="staff-dashboard-view">My Tasks</button>
                <button class="btn nav-btn" data-view="staff-attendance-view">Attendance</button>
                <button id="logout-btn" class="btn btn-danger">Logout</button>
            </nav>
        </header>
        <main class="content-area">
            <div id="staff-dashboard-view" class="view active"><div class="premium-card"><h2 class="section-title">My Tasks</h2><div id="staff-task-list"></div></div></div>
            <div id="staff-attendance-view" class="view hidden">
                <div class="premium-card">
                    <h2 class="section-title">My Attendance</h2>
                    <div class="attendance-controls">
                        <button id="clock-in-btn" class="btn btn-primary">Clock In</button>
                        <button id="clock-out-btn" class="btn btn-danger hidden">Clock Out</button>
                        <div class="break-buttons">
                            <button id="lunch-out-btn" class="btn btn-secondary disabled">Lunch Out</button><button id="lunch-in-btn" class="btn btn-secondary hidden">Lunch In</button>
                            <button id="snack-out-btn" class="btn btn-secondary disabled">Snack Out</button><button id="snack-in-btn" class="btn btn-secondary hidden">Snack In</button>
                        </div>
                    </div>
                    <div id="attendance-status-grid" class="stats-grid"></div>
                </div>
                <div class="premium-card"><h2 class="section-title">My Time Averages (Last 30 Days)</h2><div id="attendance-avg-grid" class="stats-grid"></div></div>
            </div>
        </main>
    </div>
</div>`;

// --- 3. CORE APP LOGIC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') renderAdminDashboard(user, userData);
            else renderStaffDashboard(user, userData);
        } else {
            renderStaffDashboard(user, { name: user.displayName, email: user.email });
        }
    } else {
        renderLoginPage();
    }
});

function attachGlobalListeners() {
    appRoot.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'logout-btn') signOut(auth);
        if (event.target && event.target.id === 'login-button') handleLogin();
        if (event.target && event.target.id === 'assign-task-button') handleAssignTask();
    });
    appRoot.addEventListener('change', (event) => {
        if (event.target && event.target.classList.contains('task-status-selector')) {
            handleStatusChange(event.target.dataset.taskid, event.target.value);
        }
    });
}
attachGlobalListeners();

// --- 4. RENDER FUNCTIONS ---
function renderLoginPage() { appRoot.innerHTML = loginTemplate; }

function renderAdminDashboard(user, userData) {
    appRoot.innerHTML = adminTemplate(userData);
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    setupNavigation();
    populateStaffDropdown();
    loadAdminTasks();
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
}

function renderStaffDashboard(user, userData) {
    appRoot.innerHTML = staffTemplate(userData);
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    setupNavigation();
    loadStaffTasks(user);
    setupAttendancePage(user);
}

// --- 5. SHARED & HELPER FUNCTIONS ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            views.forEach(v => {
                v.classList.remove('active');
                v.classList.add('hidden');
            });
            const viewId = e.currentTarget.dataset.view;
            const viewToShow = document.getElementById(viewId);
            if (viewToShow) {
                viewToShow.classList.remove('hidden');
                viewToShow.classList.add('active');
            }
        });
    });
}

async function handleLogin() { /* ... unchanged ... */ }
async function handleAssignTask() { /* ... unchanged ... */ }
function handleStatusChange(taskId, newStatus) { /* ... unchanged ... */ }
function populateStaffDropdown() { /* ... unchanged ... */ }
function loadAdminTasks() { /* ... unchanged ... */ }
function loadStaffTasks(user) { /* ... unchanged, but ensure query is simple ... */
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tasks.sort((a, b) => (a.createdAt > b.createdAt) ? -1 : 1);
        tasks.forEach(task => renderTaskItem(staffTaskList, task, 'staff'));
    });
}
function renderTaskItem(container, task, role) { /* ... unchanged ... */ }
function setupAttendancePage(user) { /* ... unchanged ... */ }
async function calculateAvgTimes(user) { /* ... unchanged ... */ }

// --- UPGRADED PERFORMANCE DASHBOARD ---
async function renderPerformanceDashboard() {
    const container = document.getElementById('performance-table-container');
    container.innerHTML = `<p>Calculating performance metrics...</p>`;
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
    const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
    const completedTasks = tasksSnapshot.docs.map(doc => doc.data());

    let performanceData = [];
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), where('clockIn', '>=', thirtyDaysAgo));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
        let totalInTimeMins = 0, inTimeCount = 0;
        
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.lunchIn && data.lunchOut) { totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000; lunchCount++; }
            if (data.snackIn && data.snackOut) { totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000; snackCount++; }
            if (data.clockIn) {
                const clockInDate = data.clockIn.toDate();
                totalInTimeMins += clockInDate.getHours() * 60 + clockInDate.getMinutes();
                inTimeCount++;
            }
        });

        const avgLunch = lunchCount ? (totalLunchMins / lunchCount).toFixed(0) : 'N/A';
        const avgSnack = snackCount ? (totalSnackMins / snackCount).toFixed(0) : 'N/A';
        let avgInTime = 'N/A';
        if (inTimeCount > 0) {
            const avgTotalMins = totalInTimeMins / inTimeCount;
            const hours = Math.floor(avgTotalMins / 60);
            const minutes = Math.round(avgTotalMins % 60);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            avgInTime = `${displayHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
        }
        
        performanceData.push({
            name: user.name || user.email,
            tasksCompleted: completedTasks.filter(t => t.assignedToUID === user.uid).length,
            avgLunch,
            avgSnack,
            avgInTime
        });
    }

    performanceData.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    container.innerHTML = `
        <table class="performance-table">
            <thead><tr><th>Rank</th><th>Staff</th><th>Tasks Done</th><th>Avg. Clock-In</th><th>Avg. Lunch (Min)</th><th>Avg. Snack (Min)</th></tr></thead>
            <tbody>
                ${performanceData.map((p, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.tasksCompleted}</td>
                        <td>${p.avgInTime}</td>
                        <td>${p.avgLunch}</td>
                        <td>${p.avgSnack}</td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}
