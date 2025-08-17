// --- 1. INITIALIZE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = { /* ... Your config ... */ };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL STATE & ELEMENTS ---
let currentUser = null;
let currentUserRole = 'staff';
const loginPage = document.getElementById('login-page');
const appPage = document.getElementById('app-page');
const loginButton = document.getElementById('login-button');
// ... other elements

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
    } else {
        currentUser = null;
        loginPage.classList.add('active');
        appPage.classList.remove('active');
    }
});

loginButton.addEventListener('click', () => { /* ... existing login logic ... */ });
const logout = () => signOut(auth);

// --- DASHBOARD SETUP ---
const setupDashboard = () => {
    const headerNav = document.getElementById('header-nav');
    headerNav.innerHTML = '';
    
    if (currentUserRole === 'admin') {
        headerNav.innerHTML = `
            <button class="btn nav-btn active" data-view="admin-dashboard-view">Dashboard</button>
            <button class="btn nav-btn" data-view="admin-performance-view">Performance</button>
            <button id="logout-btn-admin" class="btn btn-danger">Logout</button>`;
        showView('admin-dashboard-view');
        initializeAdminDashboard();
    } else {
        headerNav.innerHTML = `
            <button class="btn nav-btn active" data-view="staff-dashboard-view">My Tasks</button>
            <button class="btn nav-btn" data-view="staff-attendance-view">Attendance</button>
            <div id="notification-bell-container"></div>
            <button id="logout-btn-staff" class="btn btn-danger">Logout</button>`;
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
    headerNav.querySelector('button[id^="logout-btn"]').addEventListener('click', logout);
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
        
        // Create notification for the user
        await addDoc(collection(db, 'users', task.assignedToUID, 'notifications'), {
            message: `New task assigned: "${task.title}"`,
            relatedTaskId: taskRef.id,
            isRead: false,
            createdAt: serverTimestamp()
        });

        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
    });

    // Populate staff dropdown
    onSnapshot(collection(db, 'users'), snapshot => {
        const assigneeSelect = document.getElementById('task-assignee');
        assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            const user = doc.data();
            assigneeSelect.innerHTML += `<option value="${user.uid}">${user.name || user.email}</option>`;
        });
    });

    // Load tasks for admin view
    const adminTaskList = document.getElementById('admin-task-list');
    onSnapshot(query(collection(db, 'tasks'), where('status', '!=', 'Completed')), snapshot => {
        adminTaskList.innerHTML = '';
        snapshot.forEach(doc => renderTaskItem(adminTaskList, doc.data(), doc.id));
    });
    
    // Load performance data
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
};

// --- STAFF FEATURES ---
const initializeStaffDashboard = () => {
    // Load my tasks
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', currentUser.uid), orderBy('deadline', 'asc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = '';
        snapshot.forEach(doc => renderTaskItem(staffTaskList, doc.data(), doc.id));
    });
    
    // Setup Notifications
    setupNotifications();
    
    // Setup Attendance
    document.querySelector('[data-view="staff-attendance-view"]').addEventListener('click', setupAttendancePage);
};

// --- FEATURE: TASK RENDERING ---
const renderTaskItem = (container, task, taskId) => {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const deadline = task.deadline.toDate().toLocaleString('en-IN');
    const statusOptions = ['Pending', 'Started', 'In Progress', 'Completed'];
    
    let actionsHtml = '';
    if (currentUserRole === 'staff') {
        actionsHtml = `<select class="task-status-selector" data-taskid="${taskId}">
            ${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>`;
    } else {
        actionsHtml = `<span class="role">${task.status}</span>`;
    }

    item.innerHTML = `
        <div>
            <div class="task-title">${task.title}</div>
            <small>Deadline: ${deadline}</small>
        </div>
        <div>${actionsHtml}</div>`;
        
    container.appendChild(item);

    if (currentUserRole === 'staff') {
        item.querySelector('.task-status-selector').addEventListener('change', (e) => {
            const newStatus = e.target.value;
            const taskRef = doc(db, 'tasks', taskId);
            const updateData = { status: newStatus };
            if (newStatus === 'Started' && !task.startedAt) updateData.startedAt = serverTimestamp();
            if (newStatus === 'Completed' && !task.completedAt) updateData.completedAt = serverTimestamp();
            updateDoc(taskRef, updateData);
        });
    }
};

// --- FEATURE: NOTIFICATIONS ---
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
        list.innerHTML = '';
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

// --- FEATURE: ATTENDANCE ---
const setupAttendancePage = () => {
    // ... Attendance logic from previous dashboard overhaul, adapted to this structure ...
};

// --- FEATURE: PERFORMANCE DASHBOARD ---
const renderPerformanceDashboard = async () => {
    // ... Logic to fetch all users, tasks, and attendance, then calculate metrics and rank ...
};

// ... Add the full implementation for attendance and performance ...
