import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- 1. CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
    authDomain: "srikar-jewellers-crm.firebaseapp.com",
    projectId: "srikar-jewellers-crm",
    storageBucket: "srikar-jewellers-crm.firebasestorage.app",
    messagingSenderId: "377625912262",
    appId: "1:377625g12262:web:d6d05bec0d817e211b48c7",
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
                <div style="text-align: center; margin-top: 1.5rem;"><button id="assign-task-button" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Assign Task</button></div>
            </div>
            <div class="premium-card"><h2 class="section-title">All Active Tasks</h2><div id="admin-task-list"></div></div>
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
            if (userData.role === 'admin') {
                renderAdminDashboard(userData);
            } else {
                renderStaffDashboard(userData);
            }
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
}

function renderStaffDashboard(userData) {
    appRoot.innerHTML = staffTemplate(userData);
    loadStaffTasks(auth.currentUser);
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
    updateDoc(taskRef, { status: newStatus });
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
    const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'), orderBy('status'), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        adminTaskList.innerHTML = snapshot.empty ? '<p>No active tasks.</p>' : '';
        snapshot.docs.forEach(doc => renderTaskItem(adminTaskList, { id: doc.id, ...doc.data() }, 'admin'));
    });
}

function loadStaffTasks(user) {
    const staffTaskList = document.getElementById('staff-task-list');
    // CORRECTED: This query is now simple and does not require a special index.
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid));
    
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
        // Sort tasks manually after fetching them
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tasks.sort((a, b) => (a.createdAt > b.createdAt) ? -1 : 1);

        tasks.forEach(task => renderTaskItem(staffTaskList, task, 'staff'));
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
