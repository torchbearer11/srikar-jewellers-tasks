import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, limit, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- 2. HTML TEMPLATES ---
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
            <nav><button id="logout-btn" class="btn btn-danger">Logout</button></nav>
        </header>
        <main class="content-area">
            <div class="premium-card"><h2 class="section-title">Assign New Task</h2>
                <form id="assign-task-form" class="form-grid">
                    <div class="form-group"><label>Task Title</label><input type="text" id="task-title" required></div>
                    <div class="form-group"><label>Assign To</label><select id="task-assignee" required></select></div>
                    <div class="form-group"><label>Priority</label><select id="task-priority"><option value="Important">Important</option><option value="Urgent">Urgent</option><option value="Not Important">Not Important</option></select></div>
                    <div class="form-group"><label>Deadline (Optional)</label><input type="datetime-local" id="task-deadline"></div>
                </form>
                <div class="form-group"><label><input type="checkbox" id="task-recurring"> Daily Recurring Task</label></div>
                <div style="text-align: center; margin-top: 1.5rem;"><button id="assign-task-button" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Assign Task</button></div>
            </div>
            <div class="premium-card"><h2 class="section-title">All Active Tasks</h2><div id="admin-task-list"></div></div>
            <div class="premium-card"><h2 class="section-title">Staff Performance & Rankings</h2><div id="performance-table-container"><p>Loading performance data...</p></div></div>
        </main>
    </div>
</div>`;

const staffTemplate = (userData) => `
<div class="app-container">
    <div class="main-container">
        <header class="header">
            <div class="header-text"><h1>Staff Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
            <nav><button id="logout-btn" class="btn btn-danger">Logout</button></nav>
        </header>
        <main class="content-area">
            <div class="premium-card"><h2 class="section-title">My Attendance</h2>
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
            <div class="premium-card"><h2 class="section-title">My Tasks</h2><div id="staff-task-list"></div></div>
        </main>
    </div>
</div>`;

// --- 3. CORE APP LOGIC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') renderAdminDashboard(userData);
            else renderStaffDashboard(userData);
        } else {
            renderStaffDashboard({ name: user.displayName, email: user.email });
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
function renderLoginPage() {
    appRoot.innerHTML = loginTemplate;
}

function renderAdminDashboard(userData) {
    appRoot.innerHTML = adminTemplate(userData);
    populateStaffDropdown();
    loadAdminTasks();
    renderPerformanceDashboard();
}

function renderStaffDashboard(userData) {
    appRoot.innerHTML = staffTemplate(userData);
    loadStaffTasks(auth.currentUser);
    setupAttendancePage(auth.currentUser);
}

// --- 5. EVENT HANDLERS & LOGIC ---
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errorEl.textContent = 'Invalid email or password.';
    }
}

async function handleAssignTask() {
    const assigneeSelectEl = document.getElementById('task-assignee');
    const deadlineInput = document.getElementById('task-deadline');
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        assignedToUID: assigneeSelectEl.value,
        assignedToName: assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text,
        priority: document.getElementById('task-priority').value,
        status: 'Pending',
        createdAt: serverTimestamp(),
        deadline: deadlineInput.value ? Timestamp.fromDate(new Date(deadlineInput.value)) : null
    };
    if (!taskData.title || !taskData.assignedToUID) return alert('Title and Assignee are required.');
    await addDoc(collection(db, 'tasks'), taskData);
    alert('Task assigned successfully!');
    document.getElementById('assign-task-form').reset();
}

function handleStatusChange(taskId, newStatus) {
    const taskRef = doc(db, 'tasks', taskId);
    const updateData = { status: newStatus };
    if (newStatus === 'Completed') updateData.completedAt = serverTimestamp();
    updateDoc(taskRef, updateData);
}

function populateStaffDropdown() {
    const assigneeSelect = document.getElementById('task-assignee');
    onSnapshot(collection(db, 'users'), snapshot => {
        assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            if (doc.data().role !== 'admin') {
                assigneeSelect.innerHTML += `<option value="${doc.id}">${doc.data().name || doc.data().email}</option>`;
            }
        });
    });
}

function loadAdminTasks() {
    const adminTaskList = document.getElementById('admin-task-list');
    const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        adminTaskList.innerHTML = snapshot.empty ? '<p>No active tasks.</p>' : '';
        snapshot.docs.forEach(doc => renderTaskItem(adminTaskList, { id: doc.id, ...doc.data() }, 'admin'));
    });
}

function loadStaffTasks(user) {
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
        snapshot.docs.forEach(doc => renderTaskItem(staffTaskList, { id: doc.id, ...doc.data() }, 'staff'));
    });
}

function renderTaskItem(container, task, role) {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
    const statusOptions = ['Pending', 'In Progress', 'Completed'];
    let actionsHtml = (role === 'staff')
        ? `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`
        : `<div class="task-assignee-info">To: ${task.assignedToName}</div><span class="role">${task.status}</span>`;
    item.innerHTML = `<div><div class="task-title">${task.title}</div><small>Deadline: ${deadlineText}</small></div><div>${actionsHtml}</div>`;
    container.appendChild(item);
}

function setupAttendancePage(user) {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', user.uid, 'attendance', today);
    const buttons = {
        clockIn: document.getElementById('clock-in-btn'), clockOut: document.getElementById('clock-out-btn'),
        lunchOut: document.getElementById('lunch-out-btn'), lunchIn: document.getElementById('lunch-in-btn'),
        snackOut: document.getElementById('snack-out-btn'), snackIn: document.getElementById('snack-in-btn')
    };

    Object.entries(buttons).forEach(([key, btn]) => {
        btn.onclick = () => setDoc(attendanceDocRef, { [key]: serverTimestamp() }, { merge: true });
    });

    const grid = document.getElementById('attendance-status-grid');
    onSnapshot(attendanceDocRef, (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : {};
        const format = (ts) => ts ? ts.toDate().toLocaleTimeString('en-IN') : '--';
        grid.innerHTML = `<div class="stat-card"><h3>Clock In</h3><span class="stat-number">${format(data.clockIn)}</span></div><div class="stat-card"><h3>Lunch Out</h3><span class="stat-number">${format(data.lunchOut)}</span></div><div class="stat-card"><h3>Lunch In</h3><span class="stat-number">${format(data.lunchIn)}</span></div><div class="stat-card"><h3>Snack Out</h3><span class="stat-number">${format(data.snackOut)}</span></div><div class="stat-card"><h3>Snack In</h3><span class="stat-number">${format(data.snackIn)}</span></div><div class="stat-card"><h3>Clock Out</h3><span class="stat-number">${format(data.clockOut)}</span></div>`;
        buttons.clockIn.classList.toggle('hidden', !!data.clockIn);
        buttons.clockOut.classList.toggle('hidden', !data.clockIn || !!data.clockOut);
        [buttons.lunchOut, buttons.snackOut].forEach(b => b.classList.toggle('disabled', !data.clockIn || !!data.clockOut));
        buttons.lunchOut.classList.toggle('hidden', !!data.lunchOut);
        buttons.lunchIn.classList.toggle('hidden', !data.lunchOut || !!data.lunchIn);
        buttons.snackOut.classList.toggle('hidden', !!data.snackOut);
        buttons.snackIn.classList.toggle('hidden', !data.snackOut || !!data.snackIn);
    });
    
    calculateAvgTimes(user);
}

async function calculateAvgTimes(user) {
    const avgGrid = document.getElementById('attendance-avg-grid');
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const q = query(collection(db, 'users', user.uid, 'attendance'), where('clockIn', '>=', thirtyDaysAgo));
    const snapshot = await getDocs(q);
    let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lunchIn && data.lunchOut) { totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000; lunchCount++; }
        if (data.snackIn && data.snackOut) { totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000; snackCount++; }
    });
    const avgLunch = lunchCount ? (totalLunchMins / lunchCount).toFixed(0) : 0;
    const avgSnack = snackCount ? (totalSnackMins / snackCount).toFixed(0) : 0;
    avgGrid.innerHTML = `<div class="stat-card"><h3>Avg. Lunch Time</h3><span class="stat-number">${avgLunch} min</span></div><div class="stat-card"><h3>Avg. Snack Time</h3><span class="stat-number">${avgSnack} min</span></div>`;
}

async function renderPerformanceDashboard() {
    const container = document.getElementById('performance-table-container');
    container.innerHTML = `<p>Calculating performance metrics...</p>`;
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
    const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
    const completedTasks = tasksSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

    let performanceData = [];
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), where('clockIn', '>=', thirtyDaysAgo));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0, totalInTimeMins = 0, inTimeCount = 0;
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
            const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
            avgInTime = `${displayHours}:${displayMinutes} ${ampm}`;
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
            <thead><tr><th>Rank</th><th>Staff</th><th>Tasks Done</th><th>Avg. Clock-In</th><th>Avg. Lunch</th><th>Avg. Snack</th></tr></thead>
            <tbody>
                ${performanceData.map((p, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.tasksCompleted}</td>
                        <td>${p.avgInTime}</td>
                        <td>${p.avgLunch} min</td>
                        <td>${p.avgSnack} min</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}
