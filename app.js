// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// // --- 1. CONFIGURATION ---
// const firebaseConfig = {
//     apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
//     authDomain: "srikar-jewellers-crm.firebaseapp.com",
//     projectId: "srikar-jewellers-crm",
//     storageBucket: "srikar-jewellers-crm.firebasestorage.app",
//     messagingSenderId: "377625912262",
//     appId: "1:377625912262:web:d6d05bec0d817e211b48c7",
//     measurementId: "G-06K93QM4V4"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const appRoot = document.getElementById('app-root');
// let currentView = '';
// let performanceUpdateListener = null;

// // --- 2. HTML TEMPLATES ---
// const loginTemplate = `
// <div class="login-container">
//     <div class="login-box">
//         <img src="logo.jpeg" alt="Srikar Jewellers Logo" class="logo">
//         <h1 class="login-title">Srikar Jewellers</h1><p class="login-subtitle">Staff Portal</p>
//         <div class="form-group"><label for="login-email">Email Address</label><input type="email" id="login-email"></div>
//         <div class="form-group"><label for="login-password">Password</label><input type="password" id="login-password"></div>
//         <button id="login-button" class="btn btn-primary"><i class="fas fa-sign-in-alt"></i> Secure Login</button>
//         <p id="login-error"></p>
//     </div>
// </div>`;

// const adminTemplate = (userData) => `
// <div class="app-container">
//     <div class="main-container">
//         <header class="header">
//             <div class="header-text"><h1>Admin Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
//             <nav>
//                 <button class="nav-btn active" data-view="admin-dashboard">Dashboard</button>
//                 <button class="nav-btn" data-view="admin-all-tasks">All Staff Tasks</button>
//                 <button class="nav-btn" data-view="admin-performance">Performance</button>
//                 <button id="logout-btn" class="btn btn-danger">Logout</button>
//             </nav>
//         </header>
//         <main class="content-area">
//             <div id="admin-dashboard-view" class="view active">
//                 <div class="premium-card">
//                     <h2 class="section-title">Assign New Task</h2>
//                     <form id="assign-task-form" class="form-grid">
//                         <div class="form-group"><label>Task Title</label><input type="text" id="task-title" required></div>
//                         <div class="form-group"><label>Assign To</label><select id="task-assignee" required></select></div>
//                         <div class="form-group"><label>Priority</label><select id="task-priority"><option value="Important">Important</option><option value="Urgent">Urgent</option><option value="Not Important">Not Important</option></select></div>
//                         <div class="form-group"><label>Deadline (Optional)</label><input type="datetime-local" id="task-deadline"></div>
//                     </form>
//                     <div class="form-group"><label><input type="checkbox" id="task-recurring"> Daily Recurring Task</label></div>
//                     <div style="text-align: center; margin-top: 1.5rem;"><button id="assign-task-button" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Assign Task</button></div>
//                 </div>
//                 <div class="premium-card"><h2 class="section-title">All Active Tasks</h2><div id="admin-task-list"></div></div>
//             </div>
//             <div id="admin-all-tasks-view" class="view">
//                 <div class="premium-card">
//                     <h2 class="section-title">All Staff Tasks</h2>
//                     <div class="form-group" style="max-width: 300px; margin: 0 auto 2rem auto;">
//                         <label>Select Staff Member</label>
//                         <select id="staff-selector">
//                             <option value="">Select Staff...</option>
//                         </select>
//                     </div>
//                     <div id="selected-staff-tasks">
//                         <p style="text-align: center; color: var(--text-secondary);">Select a staff member to view their tasks</p>
//                     </div>
//                 </div>
//             </div>
//             <div id="admin-performance-view" class="view">
//                 <div class="premium-card">
//                     <h2 class="section-title">Staff Performance & Rankings</h2>
//                     <div class="table-responsive">
//                         <div id="performance-table-container"></div>
//                     </div>
//                 </div>
//             </div>
//         </main>
//     </div>
// </div>`;

// const staffTemplate = (userData) => `
// <div class="app-container">
//     <div class="main-container">
//         <header class="header">
//             <div class="header-text"><h1>Staff Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
//             <nav>
//                 <button class="nav-btn active" data-view="staff-tasks">My Tasks</button>
//                 <button class="nav-btn" data-view="staff-attendance">Attendance</button>
//                 <button id="logout-btn" class="btn btn-danger">Logout</button>
//             </nav>
//         </header>
//         <main class="content-area">
//             <div id="staff-tasks-view" class="view active">
//                 <div class="premium-card"><h2 class="section-title">My Tasks</h2><div id="staff-task-list"></div></div>
//             </div>
//             <div id="staff-attendance-view" class="view">
//                 <div class="premium-card">
//                     <h2 class="section-title">My Attendance</h2>
//                     <div class="attendance-controls">
//                         <button id="clock-in-btn" class="btn btn-primary">Clock In</button>
//                         <button id="clock-out-btn" class="btn btn-danger hidden">Clock Out</button>
//                         <div class="break-buttons">
//                             <button id="lunch-out-btn" class="btn btn-secondary disabled">Lunch Out</button>
//                             <button id="lunch-in-btn" class="btn btn-secondary hidden">Lunch In</button>
//                             <button id="snack-out-btn" class="btn btn-secondary disabled">Snack Out</button>
//                             <button id="snack-in-btn" class="btn btn-secondary hidden">Snack In</button>
//                         </div>
//                     </div>
//                     <div id="attendance-status-grid" class="stats-grid"></div>
//                 </div>
//                 <div class="premium-card"><h2 class="section-title">My Time Averages (All Time)</h2><div id="attendance-avg-grid" class="stats-grid"></div></div>
//             </div>
//         </main>
//     </div>
// </div>`;

// // --- 3. CORE APP LOGIC ---
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         const userDoc = await getDoc(doc(db, 'users', user.uid));
//         if (userDoc.exists()) {
//             const userData = userDoc.data();
//             if (userData.role === 'admin') {
//                 renderAdminDashboard(userData);
//             } else {
//                 renderStaffDashboard(userData);
//             }
//         } else {
//             renderStaffDashboard({ name: user.displayName, email: user.email });
//         }
//     } else {
//         renderLoginPage();
//     }
// });

// function attachGlobalListeners() {
//     appRoot.addEventListener('click', (event) => {
//         if (event.target && event.target.id === 'logout-btn') signOut(auth);
//         if (event.target && event.target.id === 'login-button') handleLogin();
//         if (event.target && event.target.id === 'assign-task-button') handleAssignTask();
//         if (event.target && event.target.classList.contains('nav-btn')) handleNavigation(event.target);
//         if (event.target && event.target.id === 'clock-in-btn') handleClockIn();
//         if (event.target && event.target.id === 'clock-out-btn') handleClockOut();
//         if (event.target && event.target.id === 'lunch-out-btn') handleLunchOut();
//         if (event.target && event.target.id === 'lunch-in-btn') handleLunchIn();
//         if (event.target && event.target.id === 'snack-out-btn') handleSnackOut();
//         if (event.target && event.target.id === 'snack-in-btn') handleSnackIn();
//     });
    
//     appRoot.addEventListener('change', (event) => {
//         if (event.target && event.target.classList.contains('task-status-selector')) {
//             handleStatusChange(event.target.dataset.taskid, event.target.value);
//         }
//         if (event.target && event.target.id === 'staff-selector') {
//             loadSelectedStaffTasks(event.target.value);
//         }
//     });
    
//     appRoot.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter' && event.target.closest('.login-box')) {
//             handleLogin();
//         }
//     });
// }

// attachGlobalListeners();

// // --- 4. RENDER FUNCTIONS ---
// function renderLoginPage() {
//     appRoot.innerHTML = loginTemplate;
// }

// function renderAdminDashboard(userData) {
//     if (performanceUpdateListener) {
//         performanceUpdateListener();
//         performanceUpdateListener = null;
//     }
//     appRoot.innerHTML = adminTemplate(userData);
//     setTimeout(() => {
//         populateStaffDropdown();
//         populateStaffSelector();
//         loadAdminTasks();
//         checkAndCreateRecurringTasks();
//         setupPerformanceListener();
//     }, 100);
//     currentView = 'admin-dashboard';
// }

// function renderStaffDashboard(userData) {
//     appRoot.innerHTML = staffTemplate(userData);
//     setTimeout(() => {
//         loadStaffTasks(auth.currentUser);
//     }, 100);
//     currentView = 'staff-tasks';
// }

// function handleNavigation(button) {
//     document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
//     button.classList.add('active');
//     document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
//     const viewId = button.dataset.view;
//     const viewElement = document.getElementById(viewId + '-view');
//     if (viewElement) {
//         viewElement.classList.add('active');
//         currentView = viewId;
        
//         if (viewId === 'admin-performance') renderPerformanceDashboard();
//         else if (viewId === 'staff-attendance') setupAttendancePage();
//         else if (viewId === 'admin-all-tasks') populateStaffSelector();
//     }
// }

// // --- 5. EVENT HANDLERS & LOGIC ---
// async function handleLogin() {
//     const email = document.getElementById('login-email').value;
//     const password = document.getElementById('login-password').value;
//     const errorEl = document.getElementById('login-error');
//     try {
//         await signInWithEmailAndPassword(auth, email, password);
//     } catch (error) {
//         errorEl.textContent = 'Invalid email or password.';
//     }
// }

// async function handleAssignTask() {
//     const assigneeSelectEl = document.getElementById('task-assignee');
//     const deadlineInput = document.getElementById('task-deadline');
//     const isRecurring = document.getElementById('task-recurring').checked;
    
//     if (!assigneeSelectEl || !assigneeSelectEl.value) return alert('Please select a staff member.');
    
//     const taskData = {
//         title: document.getElementById('task-title').value.trim(),
//         assignedToUID: assigneeSelectEl.value,
//         assignedToName: assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text,
//         priority: document.getElementById('task-priority').value,
//         status: 'Pending',
//         createdAt: serverTimestamp(),
//         isRecurring: isRecurring,
//         deadline: deadlineInput.value ? Timestamp.fromDate(new Date(deadlineInput.value)) : null,
//     };
    
//     if (!taskData.title) return alert('Title is required.');
    
//     try {
//         await addDoc(collection(db, 'tasks'), taskData);
//         alert('Task assigned successfully!');
//         document.getElementById('assign-task-form').reset();
//     } catch (error) {
//         console.error('Error assigning task:', error);
//         alert('Error assigning task. Please try again.');
//     }
// }

// async function handleStatusChange(taskId, newStatus) {
//     const taskRef = doc(db, 'tasks', taskId);
//     const updateData = { status: newStatus };
    
//     if (newStatus === 'In Progress') updateData.startedAt = serverTimestamp();
//     if (newStatus === 'Completed') updateData.completedAt = serverTimestamp();
    
//     try {
//         await updateDoc(taskRef, updateData);
//     } catch (error) {
//         console.error('Error updating task status:', error);
//     }
// }

// function populateStaffDropdown() {
//     const assigneeSelect = document.getElementById('task-assignee');
//     if (!assigneeSelect) return;
//     onSnapshot(collection(db, 'users'), snapshot => {
//         assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
//         snapshot.docs.filter(doc => doc.data().role !== 'admin').forEach(doc => {
//             assigneeSelect.innerHTML += `<option value="${doc.id}">${doc.data().name || doc.data().email}</option>`;
//         });
//     });
// }

// function populateStaffSelector() {
//     const staffSelector = document.getElementById('staff-selector');
//     if (!staffSelector) return;
//     onSnapshot(collection(db, 'users'), snapshot => {
//         staffSelector.innerHTML = '<option value="">Select Staff...</option>';
//         snapshot.docs.filter(doc => doc.data().role !== 'admin').forEach(doc => {
//             staffSelector.innerHTML += `<option value="${doc.id}">${doc.data().name || doc.data().email}</option>`;
//         });
//     });
// }

// function loadSelectedStaffTasks(staffUID) {
//     const container = document.getElementById('selected-staff-tasks');
//     if (!container) return;
    
//     if (!staffUID) {
//         container.innerHTML = '<p style="text-align: center;">Select a staff member to view their tasks</p>';
//         return;
//     }
    
//     const q = query(collection(db, 'tasks'), where('assignedToUID', '==', staffUID));
    
//     onSnapshot(q, snapshot => {
//         if (snapshot.empty) {
//             container.innerHTML = '<p style="text-align: center;">No tasks assigned to this staff member</p>';
//             return;
//         }
        
//         const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         tasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
//         const completedTasks = tasks.filter(task => task.status === 'Completed');
//         const incompleteTasks = tasks.filter(task => task.status !== 'Completed');
        
//         container.innerHTML = `
//             <div class="task-section">
//                 <h3>Incomplete Tasks (${incompleteTasks.length})</h3>
//                 <div id="incomplete-tasks-list">${incompleteTasks.length === 0 ? '<p>No incomplete tasks</p>' : ''}</div>
//             </div>
//             <div class="task-section">
//                 <h3>Completed Tasks (${completedTasks.length})</h3>
//                 <div id="completed-tasks-list">${completedTasks.length === 0 ? '<p>No completed tasks</p>' : ''}</div>
//             </div>`;
            
//         incompleteTasks.forEach(task => renderTaskItem(document.getElementById('incomplete-tasks-list'), task, 'admin-view'));
//         completedTasks.forEach(task => renderTaskItem(document.getElementById('completed-tasks-list'), task, 'admin-view'));
//     });
// }

// function loadAdminTasks() {
//     const adminTaskList = document.getElementById('admin-task-list');
//     if (!adminTaskList) return;
//     const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'));
    
//     onSnapshot(q, snapshot => {
//         const activeTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         activeTasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
//         adminTaskList.innerHTML = activeTasks.length === 0 ? '<p>No active tasks.</p>' : '';
//         activeTasks.forEach(task => renderTaskItem(adminTaskList, task, 'admin'));
//     });
// }

// function loadStaffTasks(user) {
//     const staffTaskList = document.getElementById('staff-task-list');
//     if (!staffTaskList || !user) return;
//     const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid));
    
//     onSnapshot(q, snapshot => {
//         const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         tasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
//         staffTaskList.innerHTML = tasks.length === 0 ? '<p>You have no tasks assigned.</p>' : '';
//         tasks.forEach(task => renderTaskItem(staffTaskList, task, 'staff'));
//     });
// }

// function renderTaskItem(container, task, role) {
//     const item = document.createElement('div');
//     item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
//     const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
//     const recurringBadge = task.isRecurring ? '<small style="color: #DCCA87; font-weight: bold;"> [Daily]</small>' : '';
    
//     // --- NEW: Add completion time to admin view ---
//     let completionTimeText = '';
//     if ((role === 'admin-view' || role === 'admin') && task.status === 'Completed' && task.completedAt) {
//         completionTimeText = `<br><small>Completed: ${task.completedAt.toDate().toLocaleString('en-IN')}</small>`;
//     }

//     let actionsHtml = '';
//     if (role === 'staff') {
//         const statusOptions = ['Pending', 'In Progress', 'Completed'];
//         actionsHtml = `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
//     } else if (role === 'admin') {
//         actionsHtml = `<div class="task-assignee-info">To: ${task.assignedToName}</div><span class="role">${task.status}</span>`;
//     } else if (role === 'admin-view') {
//         actionsHtml = `<span class="role">${task.status}</span>`;
//     }
    
//     item.innerHTML = `
//         <div>
//             <div class="task-title">${task.title}${recurringBadge}</div>
//             <small>Deadline: ${deadlineText}</small>
//             ${completionTimeText}
//         </div>
//         <div>${actionsHtml}</div>`;
//     container.append(item);
// }

// // --- 6. RECURRING TASKS ---
// async function checkAndCreateRecurringTasks() {
//     try {
//         const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
//         const today = new Date().toISOString().split('T')[0];
//         if (lastCheck === today) return;

//         const q = query(collection(db, 'tasks'), where('isRecurring', '==', true), where('status', '==', 'Completed'));
//         const snapshot = await getDocs(q);
//         if (snapshot.empty) return localStorage.setItem('lastRecurringTaskCheck', today);

//         const batch = writeBatch(db);
//         snapshot.forEach(docSnap => {
//             const task = docSnap.data();
//             const newDeadline = new Date();
//             newDeadline.setHours(23, 59, 59, 999);
            
//             const { id, startedAt, completedAt, ...newTaskData } = task;
//             const newTask = { 
//                 ...newTaskData, 
//                 deadline: Timestamp.fromDate(newDeadline), 
//                 status: 'Pending', 
//                 createdAt: serverTimestamp() 
//             };
            
//             batch.set(doc(collection(db, 'tasks')), newTask);
//             batch.update(docSnap.ref, { isRecurring: false });
//         });
        
//         await batch.commit();
//         localStorage.setItem('lastRecurringTaskCheck', today);
//     } catch (error) {
//         console.error('Error creating recurring tasks:', error);
//     }
// }

// // --- 7. ATTENDANCE FUNCTIONS ---
// async function updateAttendance(data) {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, data, { merge: true });
//     } catch (error) {
//         console.error('Attendance update error:', error);
//         alert('Action failed. Please try again.');
//     }
// }

// const handleClockIn = () => updateAttendance({ clockIn: serverTimestamp() });
// const handleClockOut = () => updateAttendance({ clockOut: serverTimestamp() });
// const handleLunchOut = () => updateAttendance({ lunchOut: serverTimestamp() });
// const handleLunchIn = () => updateAttendance({ lunchIn: serverTimestamp() });
// const handleSnackOut = () => updateAttendance({ snackOut: serverTimestamp() });
// const handleSnackIn = () => updateAttendance({ snackIn: serverTimestamp() });

// function setupAttendancePage() {
//     if (currentView !== 'staff-attendance') return;
    
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', new Date().toISOString().split('T')[0]);
//     const grid = document.getElementById('attendance-status-grid');
//     const buttons = {
//         clockIn: document.getElementById('clock-in-btn'), clockOut: document.getElementById('clock-out-btn'),
//         lunchOut: document.getElementById('lunch-out-btn'), lunchIn: document.getElementById('lunch-in-btn'),
//         snackOut: document.getElementById('snack-out-btn'), snackIn: document.getElementById('snack-in-btn'),
//     };

//     onSnapshot(attendanceDocRef, (docSnap) => {
//         const data = docSnap.exists() ? docSnap.data() : {};
//         const format = (ts) => ts ? ts.toDate().toLocaleTimeString('en-IN') : '--';
        
//         grid.innerHTML = `
//             <div class="stat-card"><h3>Clock In</h3><span class="stat-number">${format(data.clockIn)}</span></div>
//             <div class="stat-card"><h3>Lunch Out</h3><span class="stat-number">${format(data.lunchOut)}</span></div>
//             <div class="stat-card"><h3>Lunch In</h3><span class="stat-number">${format(data.lunchIn)}</span></div>
//             <div class="stat-card"><h3>Snack Out</h3><span class="stat-number">${format(data.snackOut)}</span></div>
//             <div class="stat-card"><h3>Snack In</h3><span class="stat-number">${format(data.snackIn)}</span></div>
//             <div class="stat-card"><h3>Clock Out</h3><span class="stat-number">${format(data.clockOut)}</span></div>`;
        
//         const isClockedIn = data.clockIn && !data.clockOut;
//         Object.values(buttons).forEach(btn => btn.classList.add('hidden'));

//         if (!data.clockIn) buttons.clockIn.classList.remove('hidden');
//         if (isClockedIn) {
//             buttons.clockOut.classList.remove('hidden');
//             if (!data.lunchOut) buttons.lunchOut.classList.remove('hidden');
//             if (data.lunchOut && !data.lunchIn) buttons.lunchIn.classList.remove('hidden');
//             if (!data.snackOut) buttons.snackOut.classList.remove('hidden');
//             if (data.snackOut && !data.snackIn) buttons.snackIn.classList.remove('hidden');
//         }
//         [buttons.lunchOut, buttons.snackOut].forEach(b => b.classList.toggle('disabled', !isClockedIn));
//     });
    
//     calculateAvgTimes();
// }

// async function calculateAvgTimes() {
//     if (currentView !== 'staff-attendance') return;
//     const avgGrid = document.getElementById('attendance-avg-grid');
//     if (!avgGrid) return;
    
//     const q = query(collection(db, 'users', auth.currentUser.uid, 'attendance'));
//     const snapshot = await getDocs(q);
    
//     let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
//     snapshot.forEach(doc => {
//         const data = doc.data();
//         if (data.lunchIn && data.lunchOut) {
//             totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis());
//             lunchCount++;
//         }
//         if (data.snackIn && data.snackOut) {
//             totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis());
//             snackCount++;
//         }
//     });
    
//     const avgLunch = lunchCount ? (totalLunchMins / lunchCount / 60000).toFixed(0) : 0;
//     const avgSnack = snackCount ? (totalSnackMins / snackCount / 60000).toFixed(0) : 0;
    
//     avgGrid.innerHTML = `
//         <div class="stat-card"><h3>Avg. Lunch Time</h3><span class="stat-number">${avgLunch} min</span></div>
//         <div class="stat-card"><h3>Avg. Snack Time</h3><span class="stat-number">${avgSnack} min</span></div>`;
// }

// // --- 8. PERFORMANCE DASHBOARD ---
// function setupPerformanceListener() {
//     if (performanceUpdateListener) performanceUpdateListener();
//     performanceUpdateListener = onSnapshot(collection(db, 'tasks'), () => {
//         if (currentView === 'admin-performance') renderPerformanceDashboard();
//     });
// }

// async function renderPerformanceDashboard() {
//     if (currentView !== 'admin-performance') return;
//     const container = document.getElementById('performance-table-container');
//     if (!container) return;
//     container.innerHTML = `<p>Calculating performance metrics...</p>`;

//     try {
//         const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
//         const tasksSnapshot = await getDocs(collection(db, 'tasks'));
//         const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         const completedTasks = allTasks.filter(task => task.status === 'Completed');

//         let performanceData = [];
//         const todayStr = new Date().toISOString().split('T')[0];

//         for (const userDoc of usersSnapshot.docs) {
//             const user = userDoc.data();
//             const userId = userDoc.id;

//             // --- NEW: Added breakdown of completed tasks by priority ---
//             const userTasks = completedTasks.filter(t => t.assignedToUID === userId);
//             const urgentCompleted = userTasks.filter(t => t.priority === 'Urgent').length;
//             const importantCompleted = userTasks.filter(t => t.priority === 'Important').length;
//             const notImportantCompleted = userTasks.filter(t => t.priority === 'Not Important').length;
            
//             // --- UPDATED: Averages are now for all time ---
//             const attendanceQuery = query(collection(db, 'users', userId, 'attendance'));
//             const attendanceSnapshot = await getDocs(attendanceQuery);
//             const todayAttendanceDoc = await getDoc(doc(db, 'users', userId, 'attendance', todayStr));
//             const todayData = todayAttendanceDoc.exists() ? todayAttendanceDoc.data() : {};
            
//             let totalLunchMs = 0, lunchCount = 0, totalSnackMs = 0, snackCount = 0, inTimeSum = 0, inTimeCount = 0;
            
//             attendanceSnapshot.forEach(doc => {
//                 const data = doc.data();
//                 if (data.lunchIn && data.lunchOut) { totalLunchMs += (data.lunchIn.toMillis() - data.lunchOut.toMillis()); lunchCount++; }
//                 if (data.snackIn && data.snackOut) { totalSnackMs += (data.snackIn.toMillis() - data.snackOut.toMillis()); snackCount++; }
//                 if (data.clockIn) {
//                     const time = data.clockIn.toDate();
//                     inTimeSum += time.getHours() * 60 + time.getMinutes();
//                     inTimeCount++;
//                 }
//             });
            
//             const toMins = (ms) => ms > 0 ? (ms / 60000).toFixed(0) : 0;
//             const formatTime = (totalMinutes) => {
//                 if (!totalMinutes || totalMinutes === 0) return '--';
//                 const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
//                 const minutes = Math.round(totalMinutes % 60).toString().padStart(2, '0');
//                 return `${hours}:${minutes}`;
//             };

//             const avgLunchTime = toMins(lunchCount > 0 ? totalLunchMs / lunchCount : 0);
//             const avgSnackTime = toMins(snackCount > 0 ? totalSnackMs / snackCount : 0);
//             const avgInTime = formatTime(inTimeCount > 0 ? inTimeSum / inTimeCount : 0);

//             // --- NEW: Calculate today's metrics ---
//             const todayLunchTime = toMins(todayData.lunchIn && todayData.lunchOut ? todayData.lunchIn.toMillis() - todayData.lunchOut.toMillis() : 0);
//             const todaySnackTime = toMins(todayData.snackIn && todayData.snackOut ? todayData.snackIn.toMillis() - todayData.snackOut.toMillis() : 0);
//             const todayInTime = todayData.clockIn ? todayData.clockIn.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--';

//             const score = (urgentCompleted * 15) + (importantCompleted * 10) + (notImportantCompleted * 5);
            
//             performanceData.push({
//                 name: user.name || user.email, urgentCompleted, importantCompleted, notImportantCompleted,
//                 avgLunchTime, todayLunchTime, avgSnackTime, todaySnackTime, avgInTime, todayInTime, score
//             });
//         }

//         performanceData.sort((a, b) => b.score - a.score);

//         container.innerHTML = `
//             <table class="performance-table">
//                 <thead>
//                     <tr>
//                         <th rowspan="2">Rank</th><th rowspan="2">Staff Name</th>
//                         <th colspan="3" style="text-align: center;">Tasks Completed</th>
//                         <th colspan="2">Lunch Time (Min)</th><th colspan="2">Snack Time (Min)</th><th colspan="2">In-Time</th>
//                     </tr>
//                     <tr>
//                         <th>Urgent</th><th>Important</th><th>Other</th>
//                         <th>Avg</th><th>Today</th><th>Avg</th><th>Today</th><th>Avg</th><th>Today</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${performanceData.map((p, index) => `
//                         <tr>
//                             <td class="rank">#${index + 1}</td><td>${p.name}</td>
//                             <td><span class="priority-badge urgent">${p.urgentCompleted}</span></td>
//                             <td><span class="priority-badge important">${p.importantCompleted}</span></td>
//                             <td><span class="priority-badge not-important">${p.notImportantCompleted}</span></td>
//                             <td>${p.avgLunchTime}</td><td>${p.todayLunchTime}</td>
//                             <td>${p.avgSnackTime}</td><td>${p.todaySnackTime}</td>
//                             <td>${p.avgInTime}</td><td>${p.todayInTime}</td>
//                         </tr>
//                     `).join('')}
//                 </tbody>
//             </table>`;
//     } catch (error) {
//         console.error('Error rendering performance dashboard:', error);
//         container.innerHTML = `<p>Error loading performance data. Please try again.</p>`;
//     }
// }
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
let currentView = '';
let performanceUpdateListener = null;

// --- 2. HTML TEMPLATES ---
// --- Templates are unchanged from the previous version ---
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
            <nav>
                <button class="nav-btn active" data-view="admin-dashboard">Dashboard</button>
                <button class="nav-btn" data-view="admin-all-tasks">All Staff Tasks</button>
                <button class="nav-btn" data-view="admin-performance">Performance</button>
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
                    <div class="form-group"><label><input type="checkbox" id="task-recurring"> Daily Recurring Task</label></div>
                    <div style="text-align: center; margin-top: 1.5rem;"><button id="assign-task-button" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Assign Task</button></div>
                </div>
                <div class="premium-card"><h2 class="section-title">All Active Tasks</h2><div id="admin-task-list"></div></div>
            </div>
            <div id="admin-all-tasks-view" class="view">
                <div class="premium-card">
                    <h2 class="section-title">All Staff Tasks</h2>
                    <div class="form-group" style="max-width: 300px; margin: 0 auto 2rem auto;">
                        <label>Select Staff Member</label>
                        <select id="staff-selector">
                            <option value="">Select Staff...</option>
                        </select>
                    </div>
                    <div id="selected-staff-tasks">
                        <p style="text-align: center; color: var(--text-secondary);">Select a staff member to view their tasks</p>
                    </div>
                </div>
            </div>
            <div id="admin-performance-view" class="view">
                <div class="premium-card">
                    <h2 class="section-title">Staff Performance & Rankings</h2>
                    <div class="table-responsive">
                        <div id="performance-table-container"></div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>
<div id="edit-task-modal" class="modal-overlay hidden">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Edit Task</h2>
            <button class="modal-close-btn" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-task-form">
                <input type="hidden" id="edit-task-id">
                <div class="form-group">
                    <label for="edit-task-title">Task Title</label>
                    <input type="text" id="edit-task-title" required>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="edit-task-assignee">Assign To</label>
                        <select id="edit-task-assignee" required></select>
                    </div>
                    <div class="form-group">
                        <label for="edit-task-priority">Priority</label>
                        <select id="edit-task-priority">
                            <option value="Urgent">Urgent</option>
                            <option value="Important">Important</option>
                            <option value="Not Important">Not Important</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-task-status">Status</label>
                        <select id="edit-task-status">
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-task-deadline">Deadline</label>
                        <input type="datetime-local" id="edit-task-deadline">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button data-action="close-modal" class="btn btn-secondary">Cancel</button>
            <button id="save-task-changes-btn" class="btn btn-primary">Save Changes</button>
        </div>
    </div>
</div>`;
const staffTemplate = (userData) => `
<div class="app-container">
    <div class="main-container">
        <header class="header">
            <div class="header-text"><h1>Staff Dashboard</h1><p>Welcome, ${userData.name || userData.email}</p></div>
            <nav>
                <button class="nav-btn active" data-view="staff-tasks">My Tasks</button>
                <button class="nav-btn" data-view="staff-attendance">Attendance</button>
                <button id="logout-btn" class="btn btn-danger">Logout</button>
            </nav>
        </header>
        <main class="content-area">
            <div id="staff-tasks-view" class="view active">
                <div class="task-portal">
                    <h2 class="section-title">Today's Tasks</h2>
                    <div id="today-tasks-container"></div>
                </div>
                <div class="task-portal">
                    <h2 class="section-title">Upcoming Tasks</h2>
                    <div id="upcoming-tasks-container"></div>
                </div>
                <div class="task-portal">
                    <h2 class="section-title">Overdue Tasks</h2>
                    <div id="overdue-tasks-container"></div>
                </div>
            </div>
            <div id="staff-attendance-view" class="view">
                <div class="premium-card">
                    <h2 class="section-title">My Attendance</h2>
                    <div class="attendance-controls">
                        <button id="clock-in-btn" class="btn btn-primary">Clock In</button>
                        <button id="clock-out-btn" class="btn btn-danger hidden">Clock Out</button>
                        <div class="break-buttons">
                            <button id="lunch-out-btn" class="btn btn-secondary disabled">Lunch Out</button>
                            <button id="lunch-in-btn" class="btn btn-secondary hidden">Lunch In</button>
                            <button id="snack-out-btn" class="btn btn-secondary disabled">Snack Out</button>
                            <button id="snack-in-btn" class="btn btn-secondary hidden">Snack In</button>
                        </div>
                    </div>
                    <div id="attendance-status-grid" class="stats-grid"></div>
                </div>
                <div class="premium-card"><h2 class="section-title">My Time Averages (All Time)</h2><div id="attendance-avg-grid" class="stats-grid"></div></div>
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
            if (userData.role === 'admin') renderAdminDashboard(userData);
            else renderStaffDashboard(userData);
        } else {
            renderStaffDashboard({ name: user.displayName, email: user.email });
        }
    } else {
        renderLoginPage();
    }
});

// --- CORRECTED: Simplified event handler for better reliability ---
function attachGlobalListeners() {
    appRoot.addEventListener('click', (event) => {
        const target = event.target.closest('button'); // Use closest to handle clicks on icons inside buttons
        if (!target) return;

        // Use a switch statement for cleaner logic
        switch (target.id) {
            case 'logout-btn': signOut(auth); break;
            case 'login-button': handleLogin(); break;
            case 'assign-task-button': handleAssignTask(); break;
            case 'clock-in-btn': handleClockIn(); break;
            case 'clock-out-btn': handleClockOut(); break;
            case 'lunch-out-btn': handleLunchOut(); break;
            case 'lunch-in-btn': handleLunchIn(); break;
            case 'snack-out-btn': handleSnackOut(); break;
            case 'snack-in-btn': handleSnackIn(); break;
            case 'save-task-changes-btn': handleSaveChanges(); break;
        }

        // Handle buttons with classes or data attributes
        if (target.classList.contains('nav-btn')) handleNavigation(target);
        if (target.classList.contains('btn-edit-task')) openEditModal(target.dataset.taskid);
        if (target.dataset.action === 'close-modal') {
            document.getElementById('edit-task-modal').classList.add('hidden');
        }
    });
    
    appRoot.addEventListener('change', (event) => {
        const target = event.target;
        if (target.classList.contains('task-status-selector')) {
            handleStatusChange(target.dataset.taskid, target.value);
        }
        if (target.id === 'staff-selector') {
            loadSelectedStaffTasks(target.value);
        }
    });
    
    appRoot.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && event.target.closest('.login-box')) handleLogin();
    });
}

attachGlobalListeners();

// --- 4. RENDER FUNCTIONS ---
function renderLoginPage() { appRoot.innerHTML = loginTemplate; }

function renderAdminDashboard(userData) {
    if (performanceUpdateListener) performanceUpdateListener();
    appRoot.innerHTML = adminTemplate(userData);
    setTimeout(() => {
        populateStaffDropdown(document.getElementById('task-assignee'));
        populateStaffDropdown(document.getElementById('edit-task-assignee'));
        // --- FIX: Call the correct function for the staff selector ---
        populateStaffDropdown(document.getElementById('staff-selector'));
        loadAdminTasks();
        checkAndCreateRecurringTasks();
        setupPerformanceListener();
    }, 100);
    currentView = 'admin-dashboard';
}

function renderStaffDashboard(userData) {
    appRoot.innerHTML = staffTemplate(userData);
    setTimeout(() => loadStaffTasks(auth.currentUser), 100);
    currentView = 'staff-tasks';
}

function handleNavigation(button) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    const viewId = button.dataset.view;
    const viewElement = document.getElementById(`${viewId}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
        currentView = viewId;
        
        if (viewId === 'admin-performance') renderPerformanceDashboard();
        else if (viewId === 'staff-attendance') setupAttendancePage();
        // --- FIX: Correct function call on navigation ---
        else if (viewId === 'admin-all-tasks') {
            populateStaffDropdown(document.getElementById('staff-selector'));
        }
    }
}

// --- 5. CORE LOGIC ---
async function handleLogin() { /* ... Unchanged ... */ }
async function handleAssignTask() { /* ... Unchanged ... */ }
async function handleStatusChange(taskId, newStatus) { /* ... Unchanged ... */ }

// --- Consolidated dropdown populator ---
function populateStaffDropdown(selectElement) {
    if (!selectElement) return;
    onSnapshot(collection(db, 'users'), snapshot => {
        const currentVal = selectElement.value;
        const staff = snapshot.docs
            .filter(doc => doc.data().role !== 'admin')
            .map(doc => ({ id: doc.id, data: doc.data() }));

        selectElement.innerHTML = `<option value="">Select Staff...</option>`;
        staff.forEach(user => {
            selectElement.innerHTML += `<option value="${user.id}">${user.data.name || user.data.email}</option>`;
        });
        selectElement.value = currentVal;
    });
}
function loadSelectedStaffTasks(staffUID) { /* ... Unchanged ... */ }
function loadAdminTasks() { /* ... Unchanged ... */ }
function loadStaffTasks(user) { /* ... Unchanged, uses helper below ... */ }
function renderPriorityGroupedTasks(containerId, tasks, emptyMessage) { /* ... Unchanged ... */ }
function renderTaskItem(container, task, role) { /* ... Unchanged ... */ }
async function checkAndCreateRecurringTasks() { /* ... Unchanged ... */ }

// --- NEW/UPDATED MODAL & SAVE LOGIC ---
async function openEditModal(taskId) {
    const modal = document.getElementById('edit-task-modal');
    if (!modal) return;
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);

    if (taskSnap.exists()) {
        const task = taskSnap.data();
        document.getElementById('edit-task-id').value = taskId;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-assignee').value = task.assignedToUID;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-status').value = task.status;
        if (task.deadline) {
            const d = task.deadline.toDate();
            const pad = (num) => num.toString().padStart(2, '0');
            const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            document.getElementById('edit-task-deadline').value = formattedDate;
        } else {
            document.getElementById('edit-task-deadline').value = '';
        }
        modal.classList.remove('hidden');
    } else {
        alert('Task not found.');
    }
}

async function handleSaveChanges() {
    const taskId = document.getElementById('edit-task-id').value;
    const assigneeSelect = document.getElementById('edit-task-assignee');
    const deadlineValue = document.getElementById('edit-task-deadline').value;

    // --- FIX: Added validation ---
    if (assigneeSelect.selectedIndex === -1 || !assigneeSelect.value) {
        return alert("Please select a staff member to assign the task to.");
    }
    if (!taskId) return alert('Error: Task ID is missing.');

    const updatedData = {
        title: document.getElementById('edit-task-title').value,
        assignedToUID: assigneeSelect.value,
        assignedToName: assigneeSelect.options[assigneeSelect.selectedIndex].text,
        priority: document.getElementById('edit-task-priority').value,
        status: document.getElementById('edit-task-status').value,
        deadline: deadlineValue ? Timestamp.fromDate(new Date(deadlineValue)) : null,
    };

    const taskRef = doc(db, 'tasks', taskId);
    try {
        await updateDoc(taskRef, updatedData);
        alert('Task updated successfully!');
        document.getElementById('edit-task-modal').classList.add('hidden');
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task.');
    }
}


// --- 7. ATTENDANCE FUNCTIONS (UNCHANGED) ---
async function updateAttendance(data) { /* ... Unchanged ... */ }
const handleClockIn = () => updateAttendance({ clockIn: serverTimestamp() });
const handleClockOut = () => updateAttendance({ clockOut: serverTimestamp() });
const handleLunchOut = () => updateAttendance({ lunchOut: serverTimestamp() });
const handleLunchIn = () => updateAttendance({ lunchIn: serverTimestamp() });
const handleSnackOut = () => updateAttendance({ snackOut: serverTimestamp() });
const handleSnackIn = () => updateAttendance({ snackIn: serverTimestamp() });
function setupAttendancePage() { /* ... Unchanged ... */ }
async function calculateAvgTimes() { /* ... Unchanged ... */ }


// --- 8. PERFORMANCE DASHBOARD (UNCHANGED) ---
function setupPerformanceListener() { /* ... Unchanged ... */ }
async function renderPerformanceDashboard() { /* ... Unchanged ... */ }

// --- Utility Functions (unchanged logic, just re-pasting for completeness) ---
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
    const isRecurring = document.getElementById('task-recurring').checked;
    
    if (!assigneeSelectEl || !assigneeSelectEl.value) return alert('Please select a staff member.');
    
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        assignedToUID: assigneeSelectEl.value,
        assignedToName: assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text,
        priority: document.getElementById('task-priority').value,
        status: 'Pending',
        createdAt: serverTimestamp(),
        isRecurring: isRecurring,
        deadline: deadlineInput.value ? Timestamp.fromDate(new Date(deadlineInput.value)) : null,
    };
    
    if (!taskData.title) return alert('Title is required.');
    
    try {
        await addDoc(collection(db, 'tasks'), taskData);
        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
    } catch (error) {
        console.error('Error assigning task:', error);
        alert('Error assigning task. Please try again.');
    }
}
async function handleStatusChange(taskId, newStatus) {
    const taskRef = doc(db, 'tasks', taskId);
    const updateData = { status: newStatus };
    
    if (newStatus === 'In Progress') updateData.startedAt = serverTimestamp();
    if (newStatus === 'Completed') updateData.completedAt = serverTimestamp();
    
    try {
        await updateDoc(taskRef, updateData);
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}
function loadSelectedStaffTasks(staffUID) {
    const container = document.getElementById('selected-staff-tasks');
    if (!container) return;
    
    if (!staffUID) {
        container.innerHTML = '<p style="text-align: center;">Select a staff member to view their tasks</p>';
        return;
    }
    
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', staffUID));
    
    onSnapshot(q, snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align: center;">No tasks assigned to this staff member</p>';
            return;
        }
        
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        const completedTasks = tasks.filter(task => task.status === 'Completed');
        const incompleteTasks = tasks.filter(task => task.status !== 'Completed');
        
        container.innerHTML = `
            <div class="task-section">
                <h3>Incomplete Tasks (${incompleteTasks.length})</h3>
                <div id="incomplete-tasks-list">${incompleteTasks.length === 0 ? '<p>No incomplete tasks</p>' : ''}</div>
            </div>
            <div class="task-section">
                <h3>Completed Tasks (${completedTasks.length})</h3>
                <div id="completed-tasks-list">${completedTasks.length === 0 ? '<p>No completed tasks</p>' : ''}</div>
            </div>`;
            
        incompleteTasks.forEach(task => renderTaskItem(document.getElementById('incomplete-tasks-list'), task, 'admin-view'));
        completedTasks.forEach(task => renderTaskItem(document.getElementById('completed-tasks-list'), task, 'admin-view'));
    });
}
function loadAdminTasks() {
    const adminTaskList = document.getElementById('admin-task-list');
    if (!adminTaskList) return;
    const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'));
    
    onSnapshot(q, snapshot => {
        const activeTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        activeTasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        adminTaskList.innerHTML = activeTasks.length === 0 ? '<p>No active tasks.</p>' : '';
        activeTasks.forEach(task => renderTaskItem(adminTaskList, task, 'admin'));
    });
}
function loadStaffTasks(user) {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid), where('status', '!=', 'Completed'));

    onSnapshot(q, snapshot => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const todayTasks = [];
        const upcomingTasks = [];
        const overdueTasks = [];

        tasks.forEach(task => {
            if (!task.deadline) {
                upcomingTasks.push(task);
                return;
            }
            const deadlineDate = task.deadline.toDate();
            if (deadlineDate < startOfToday) overdueTasks.push(task);
            else if (deadlineDate >= startOfToday && deadlineDate <= endOfToday) todayTasks.push(task);
            else upcomingTasks.push(task);
        });

        renderPriorityGroupedTasks('today-tasks-container', todayTasks, "No tasks due today.");
        renderPriorityGroupedTasks('upcoming-tasks-container', upcomingTasks, "No upcoming tasks.");
        renderPriorityGroupedTasks('overdue-tasks-container', overdueTasks, "No overdue tasks. Great job!");
    });
}
function renderPriorityGroupedTasks(containerId, tasks, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = `<p>${emptyMessage}</p>`;
        return;
    }
    
    const priorities = ['Urgent', 'Important', 'Not Important'];
    priorities.forEach(priority => {
        const filteredTasks = tasks.filter(task => task.priority === priority);
        if (filteredTasks.length > 0) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'priority-group';
            const title = document.createElement('h3');
            title.textContent = priority;
            groupDiv.appendChild(title);
            filteredTasks
                .sort((a,b) => (a.deadline?.toMillis() || 0) - (b.deadline?.toMillis() || 0))
                .forEach(task => renderTaskItem(groupDiv, task, 'staff'));
            container.appendChild(groupDiv);
        }
    });
}
function renderTaskItem(container, task, role) {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
    const recurringBadge = task.isRecurring ? '<small style="color: #DCCA87; font-weight: bold;"> [Daily]</small>' : '';
    
    let completionTimeText = '';
    if ((role === 'admin-view' || role === 'admin') && task.status === 'Completed' && task.completedAt) {
        completionTimeText = `<br><small>Completed: ${task.completedAt.toDate().toLocaleString('en-IN')}</small>`;
    }

    let actionsHtml = '';
    if (role === 'staff') {
        const statusOptions = ['Pending', 'In Progress', 'Completed'];
        actionsHtml = `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
    } else if (role === 'admin' || role === 'admin-view') {
        const editButton = role === 'admin' ? `<button class="btn btn-edit btn-edit-task" data-taskid="${task.id}"><i class="fas fa-pencil-alt"></i> Edit</button>` : '';
        const assigneeInfo = role === 'admin' ? `<div class="task-assignee-info">To: ${task.assignedToName}</div>` : '';
        actionsHtml = `<div style="text-align: right;">${assigneeInfo}<span class="role">${task.status}</span><div style="margin-top: 5px;">${editButton}</div></div>`;
    }
    
    item.innerHTML = `
        <div>
            <div class="task-title">${task.title}${recurringBadge}</div>
            <small>Deadline: ${deadlineText}</small>
            ${completionTimeText}
        </div>
        <div>${actionsHtml}</div>`;
    container.append(item);
}
async function checkAndCreateRecurringTasks() {
    try {
        const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
        const today = new Date().toISOString().split('T')[0];
        if (lastCheck === today) return;

        const q = query(collection(db, 'tasks'), where('isRecurring', '==', true), where('status', '==', 'Completed'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return localStorage.setItem('lastRecurringTaskCheck', today);

        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
            const task = docSnap.data();
            const newDeadline = new Date();
            newDeadline.setHours(23, 59, 59, 999);
            
            const { id, startedAt, completedAt, ...newTaskData } = task;
            const newTask = { 
                ...newTaskData, 
                deadline: Timestamp.fromDate(newDeadline), 
                status: 'Pending', 
                createdAt: serverTimestamp() 
            };
            
            batch.set(doc(collection(db, 'tasks')), newTask);
            batch.update(docSnap.ref, { isRecurring: false });
        });
        
        await batch.commit();
        localStorage.setItem('lastRecurringTaskCheck', today);
    } catch (error) {
        console.error('Error creating recurring tasks:', error);
    }
}
async function updateAttendance(data) {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, data, { merge: true });
    } catch (error) {
        console.error('Attendance update error:', error);
        alert('Action failed. Please try again.');
    }
}
function setupAttendancePage() {
    if (currentView !== 'staff-attendance') return;
    
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', new Date().toISOString().split('T')[0]);
    const grid = document.getElementById('attendance-status-grid');
    const buttons = {
        clockIn: document.getElementById('clock-in-btn'), clockOut: document.getElementById('clock-out-btn'),
        lunchOut: document.getElementById('lunch-out-btn'), lunchIn: document.getElementById('lunch-in-btn'),
        snackOut: document.getElementById('snack-out-btn'), snackIn: document.getElementById('snack-in-btn'),
    };

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
        
        const isClockedIn = data.clockIn && !data.clockOut;
        Object.values(buttons).forEach(btn => btn.classList.add('hidden'));

        if (!data.clockIn) buttons.clockIn.classList.remove('hidden');
        if (isClockedIn) {
            buttons.clockOut.classList.remove('hidden');
            if (!data.lunchOut) buttons.lunchOut.classList.remove('hidden');
            if (data.lunchOut && !data.lunchIn) buttons.lunchIn.classList.remove('hidden');
            if (!data.snackOut) buttons.snackOut.classList.remove('hidden');
            if (data.snackOut && !data.snackIn) buttons.snackIn.classList.remove('hidden');
        }
        [buttons.lunchOut, buttons.snackOut].forEach(b => b.classList.toggle('disabled', !isClockedIn));
    });
    
    calculateAvgTimes();
}
async function calculateAvgTimes() {
    if (currentView !== 'staff-attendance') return;
    const avgGrid = document.getElementById('attendance-avg-grid');
    if (!avgGrid) return;
    
    const q = query(collection(db, 'users', auth.currentUser.uid, 'attendance'));
    const snapshot = await getDocs(q);
    
    let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lunchIn && data.lunchOut) {
            totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis());
            lunchCount++;
        }
        if (data.snackIn && data.snackOut) {
            totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis());
            snackCount++;
        }
    });
    
    const avgLunch = lunchCount ? (totalLunchMins / lunchCount / 60000).toFixed(0) : 0;
    const avgSnack = snackCount ? (totalSnackMins / snackCount / 60000).toFixed(0) : 0;
    
    avgGrid.innerHTML = `
        <div class="stat-card"><h3>Avg. Lunch Time</h3><span class="stat-number">${avgLunch} min</span></div>
        <div class="stat-card"><h3>Avg. Snack Time</h3><span class="stat-number">${avgSnack} min</span></div>`;
}
function setupPerformanceListener() {
    if (performanceUpdateListener) performanceUpdateListener();
    performanceUpdateListener = onSnapshot(collection(db, 'tasks'), () => {
        if (currentView === 'admin-performance') renderPerformanceDashboard();
    });
}
async function renderPerformanceDashboard() {
    if (currentView !== 'admin-performance') return;
    const container = document.getElementById('performance-table-container');
    if (!container) return;
    container.innerHTML = `<p>Calculating performance metrics...</p>`;

    try {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const completedTasks = allTasks.filter(task => task.status === 'Completed');

        let performanceData = [];
        const todayStr = new Date().toISOString().split('T')[0];

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            const userId = userDoc.id;

            const userTasks = completedTasks.filter(t => t.assignedToUID === userId);
            const urgentCompleted = userTasks.filter(t => t.priority === 'Urgent').length;
            const importantCompleted = userTasks.filter(t => t.priority === 'Important').length;
            const notImportantCompleted = userTasks.filter(t => t.priority === 'Not Important').length;
            
            const attendanceQuery = query(collection(db, 'users', userId, 'attendance'));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            const todayAttendanceDoc = await getDoc(doc(db, 'users', userId, 'attendance', todayStr));
            const todayData = todayAttendanceDoc.exists() ? todayAttendanceDoc.data() : {};
            
            let totalLunchMs = 0, lunchCount = 0, totalSnackMs = 0, snackCount = 0, inTimeSum = 0, inTimeCount = 0;
            
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.lunchIn && data.lunchOut) { totalLunchMs += (data.lunchIn.toMillis() - data.lunchOut.toMillis()); lunchCount++; }
                if (data.snackIn && data.snackOut) { totalSnackMs += (data.snackIn.toMillis() - data.snackOut.toMillis()); snackCount++; }
                if (data.clockIn) {
                    const time = data.clockIn.toDate();
                    inTimeSum += time.getHours() * 60 + time.getMinutes();
                    inTimeCount++;
                }
            });
            
            const toMins = (ms) => ms > 0 ? (ms / 60000).toFixed(0) : 0;
            const formatTime = (totalMinutes) => {
                if (!totalMinutes || totalMinutes === 0) return '--';
                const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                const minutes = Math.round(totalMinutes % 60).toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            };

            const avgLunchTime = toMins(lunchCount > 0 ? totalLunchMs / lunchCount : 0);
            const avgSnackTime = toMins(snackCount > 0 ? totalSnackMs / snackCount : 0);
            const avgInTime = formatTime(inTimeCount > 0 ? inTimeSum / inTimeCount : 0);

            const todayLunchTime = toMins(todayData.lunchIn && todayData.lunchOut ? todayData.lunchIn.toMillis() - todayData.lunchOut.toMillis() : 0);
            const todaySnackTime = toMins(todayData.snackIn && todayData.snackOut ? todayData.snackIn.toMillis() - todayData.snackOut.toMillis() : 0);
            const todayInTime = todayData.clockIn ? todayData.clockIn.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--';

            const score = (urgentCompleted * 15) + (importantCompleted * 10) + (notImportantCompleted * 5);
            
            performanceData.push({
                name: user.name || user.email, urgentCompleted, importantCompleted, notImportantCompleted,
                avgLunchTime, todayLunchTime, avgSnackTime, todaySnackTime, avgInTime, todayInTime, score
            });
        }

        performanceData.sort((a, b) => b.score - a.score);

        container.innerHTML = `
            <table class="performance-table">
                <thead>
                    <tr>
                        <th rowspan="2">Rank</th><th rowspan="2">Staff Name</th>
                        <th colspan="3" style="text-align: center;">Tasks Completed</th>
                        <th colspan="2">Lunch Time (Min)</th><th colspan="2">Snack Time (Min)</th><th colspan="2">In-Time</th>
                    </tr>
                    <tr>
                        <th>Urgent</th><th>Important</th><th>Other</th>
                        <th>Avg</th><th>Today</th><th>Avg</th><th>Today</th><th>Avg</th><th>Today</th>
                    </tr>
                </thead>
                <tbody>
                    ${performanceData.map((p, index) => `
                        <tr>
                            <td class="rank">#${index + 1}</td><td>${p.name}</td>
                            <td><span class="priority-badge urgent">${p.urgentCompleted}</span></td>
                            <td><span class="priority-badge important">${p.importantCompleted}</span></td>
                            <td><span class="priority-badge not-important">${p.notImportantCompleted}</span></td>
                            <td>${p.avgLunchTime}</td><td>${p.todayLunchTime}</td>
                            <td>${p.avgSnackTime}</td><td>${p.todaySnackTime}</td>
                            <td>${p.avgInTime}</td><td>${p.todayInTime}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch (error) {
        console.error('Error rendering performance dashboard:', error);
        container.innerHTML = `<p>Error loading performance data. Please try again.</p>`;
    }
}
