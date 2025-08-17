// --- 1. INITIALIZE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
    document.getElementById(viewId)?.classList.add('active');
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentUser.displayName = userDoc.data().name; // Add name to user object
            currentUserRole = userDoc.data().role || 'staff';
        }
        loginPage.classList.remove('active');
        appPage.classList.add('active');
        setupDashboard();
        if(currentUserRole === 'admin') checkAndCreateRecurringTasks();
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
        headerSubtitle.textContent = `Welcome, ${currentUser.displayName || currentUser.email}`;
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
        const assignedToUID = document.getElementById('task-assignee').value;
        const assigneeSelect = document.getElementById('task-assignee');
        const assignedToName = assigneeSelect.options[assigneeSelect.selectedIndex].text;

        const task = {
            title: document.getElementById('task-title').value,
            assignedToUID: assignedToUID,
            assignedToName: assignedToName,
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
        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
    });

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

    const adminTaskList = document.getElementById('admin-task-list');
    onSnapshot(query(collection(db, 'tasks'), where('status', '!=', 'Completed')), snapshot => {
        adminTaskList.innerHTML = '';
        snapshot.docs.forEach(doc => renderTaskItem(adminTaskList, { id: doc.id, ...doc.data() }));
    });
    
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
};

// --- STAFF FEATURES ---
const initializeStaffDashboard = () => {
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', currentUser.uid), orderBy('deadline', 'asc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = '<h3>My Active Tasks</h3>';
        snapshot.docs.forEach(doc => renderTaskItem(staffTaskList, { id: doc.id, ...doc.data() }));
    });
    
    setupNotifications();
    document.querySelector('[data-view="staff-attendance-view"]').addEventListener('click', setupAttendancePage);
};

// --- TASK RENDERING & STATUS UPDATE ---
const renderTaskItem = (container, task) => {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const deadline = task.deadline.toDate().toLocaleString('en-IN');
    const statusOptions = ['Pending', 'Started', 'In Progress', 'Completed'];
    
    let actionsHtml = (currentUserRole === 'staff')
        ? `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`
        : `<div class="task-assignee-info">To: ${task.assignedToName}</div><span class="role">${task.status}</span>`;

    item.innerHTML = `<div><div class="task-title">${task.title}</div><small>Deadline: ${deadline}</small></div><div>${actionsHtml}</div>`;
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
const setupNotifications = () => {
    const bellContainer = document.getElementById('notification-bell-container');
    bellContainer.innerHTML = `<button id="notification-bell" class="notification-bell"><i class="fas fa-bell"></i><span id="notification-dot" class="notification-dot"></span></button>`;
    
    const bell = document.getElementById('notification-bell');
    const dot = document.getElementById('notification-dot');
    const panel = document.getElementById('notification-panel');

    const q = query(collection(db, 'users', currentUser.uid, 'notifications'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs;
        const unreadCount = notifs.filter(d => !d.data().isRead).length;
        dot.classList.toggle('visible', unreadCount > 0);
        
        const list = document.getElementById('notification-list');
        list.innerHTML = notifs.length === 0 ? '<div class="notification-item">No new notifications.</div>' : '';
        notifs.forEach(doc => {
            const notif = doc.data();
            const item = document.createElement('div');
            item.className = `notification-item ${!notif.isRead ? 'unread' : ''}`;
            item.innerHTML = `<p>${notif.message}</p><small>${notif.createdAt.toDate().toLocaleString('en-IN')}</small>`;
            list.appendChild(item);
        });
    });

    bell.addEventListener('click', async () => {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
            const unreadQuery = query(notifsRef, where('isRead', '==', false));
            const unreadSnapshot = await getDocs(unreadQuery);
            const batch = writeBatch(db);
            unreadSnapshot.forEach(doc => batch.update(doc.ref, { isRead: true }));
            await batch.commit();
        }
    });
};

// --- ATTENDANCE ---
const setupAttendancePage = () => {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', currentUser.uid, 'attendance', today);
    const buttons = {
        clockIn: document.getElementById('clock-in-btn'), clockOut: document.getElementById('clock-out-btn'),
        lunchOut: document.getElementById('lunch-out-btn'), lunchIn: document.getElementById('lunch-in-btn'),
        snackOut: document.getElementById('snack-out-btn'), snackIn: document.getElementById('snack-in-btn')
    };

    buttons.clockIn.onclick = () => setDoc(attendanceDocRef, { clockIn: serverTimestamp() }, { merge: true });
    buttons.clockOut.onclick = () => setDoc(attendanceDocRef, { clockOut: serverTimestamp() }, { merge: true });
    buttons.lunchOut.onclick = () => setDoc(attendanceDocRef, { lunchOut: serverTimestamp() }, { merge: true });
    buttons.lunchIn.onclick = () => setDoc(attendanceDocRef, { lunchIn: serverTimestamp() }, { merge: true });
    buttons.snackOut.onclick = () => setDoc(attendanceDocRef, { snackOut: serverTimestamp() }, { merge: true });
    buttons.snackIn.onclick = () => setDoc(attendanceDocRef, { snackIn: serverTimestamp() }, { merge: true });

    const grid = document.getElementById('attendance-status-grid');
    onSnapshot(attendanceDocRef, (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : {};
        const format = (ts) => ts ? ts.toDate().toLocaleTimeString('en-IN') : '--';
        
        grid.innerHTML = `
            <div class="stat-card"><h3>Clock In</h3><span class="stat-number">${format(data.clockIn)}</span></div>
            <div class="stat-card"><h3>Lunch Out</h3><span class="stat-number">${format(data.lunchOut)}</span></div>
            <div class="stat-card"><h3>Lunch In</h3><span class="stat-number">${format(data.lunchIn)}</span></div>
            <div class="stat-card"><h3>Snack Out</h3><span class="stat-number">${format(data.snackOut)}</span></div>
            <div class="stat-card"><h3>Snack In</h3><span class="stat-number">${format(data.snackIn)}</span></div>
            <div class="stat-card"><h3>Clock Out</h3><span class="stat-number">${format(data.clockOut)}</span></div>`;
        
        buttons.clockIn.classList.toggle('hidden', !!data.clockIn);
        buttons.clockOut.classList.toggle('hidden', !data.clockIn || !!data.clockOut);
        [buttons.lunchOut, buttons.snackOut].forEach(b => b.classList.toggle('disabled', !data.clockIn || !!data.clockOut));
        buttons.lunchOut.classList.toggle('hidden', !!data.lunchOut);
        buttons.lunchIn.classList.toggle('hidden', !data.lunchOut || !!data.lunchIn);
        buttons.snackOut.classList.toggle('hidden', !!data.snackOut);
        buttons.snackIn.classList.toggle('hidden', !data.snackOut || !!data.snackIn);
    });
    
    calculateAvgTimes();
};

const calculateAvgTimes = async () => {
    const avgGrid = document.getElementById('attendance-avg-grid');
    const q = query(collection(db, 'users', currentUser.uid, 'attendance'), limit(30));
    const snapshot = await getDocs(q);
    let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
    
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lunchIn && data.lunchOut) {
            totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000;
            lunchCount++;
        }
        if (data.snackIn && data.snackOut) {
            totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000;
            snackCount++;
        }
    });
    
    const avgLunch = lunchCount ? (totalLunchMins / lunchCount).toFixed(0) : 0;
    const avgSnack = snackCount ? (totalSnackMins / snackCount).toFixed(0) : 0;
    
    avgGrid.innerHTML = `
        <div class="stat-card"><h3>Avg. Lunch Time</h3><span class="stat-number">${avgLunch} min</span></div>
        <div class="stat-card"><h3>Avg. Snack Time</h3><span class="stat-number">${avgSnack} min</span></div>`;
};


// --- RECURRING TASKS ---
const checkAndCreateRecurringTasks = async () => {
    const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck === today) return;

    const q = query(collection(db, 'tasks'), where('isRecurring', '==', true), where('status', '==', 'Completed'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.forEach(doc => {
        const task = doc.data();
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + 1); // Set deadline for tomorrow
        
        const newTask = { ...task, deadline: Timestamp.fromDate(newDeadline), status: 'Pending', createdAt: serverTimestamp() };
        delete newTask.id; delete newTask.startedAt; delete newTask.completedAt;
        
        const newTaskRef = doc(collection(db, 'tasks'));
        batch.set(newTaskRef, newTask);
        batch.update(doc.ref, { isRecurring: false }); // Mark old one as non-recurring
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

    let performanceData = [];
    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid && t.startedAt);
        
        const completionTimes = userTasks.map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000); // hours
        const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
        
        // Simplified scoring: more tasks = better, less time = better
        const score = (userTasks.length * 10) - avgCompletionHours;
        
        performanceData.push({
            name: user.name || user.email,
            tasksCompleted: userTasks.length,
            avgTime: avgCompletionHours.toFixed(2),
            score
        });
    }

    performanceData.sort((a, b) => b.score - a.score);

    container.innerHTML = `
        <table class="performance-table">
            <thead><tr><th>Rank</th><th>Staff Name</th><th>Tasks Completed</th><th>Avg. Completion (Hours)</th></tr></thead>
            <tbody>
                ${performanceData.length === 0 ? '<tr><td colspan="4">No completed tasks with performance data yet.</td></tr>' : 
                  performanceData.map((p, index) => `
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
