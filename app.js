// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, limit, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
//             <div id="admin-performance-view" class="view">
//                 <div class="premium-card"><h2 class="section-title">Staff Performance & Rankings</h2><div id="performance-table-container"></div></div>
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
//                 <div class="premium-card"><h2 class="section-title">My Time Averages (Last 30 Days)</h2><div id="attendance-avg-grid" class="stats-grid"></div></div>
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
        
//         // Navigation buttons
//         if (event.target && event.target.classList.contains('nav-btn')) {
//             handleNavigation(event.target);
//         }
        
//         // Attendance buttons
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
//     });
    
//     appRoot.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter' && event.target.id === 'login-password') {
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
//     appRoot.innerHTML = adminTemplate(userData);
//     populateStaffDropdown();
//     loadAdminTasks();
//     checkAndCreateRecurringTasks();
//     currentView = 'admin-dashboard';
// }

// function renderStaffDashboard(userData) {
//     appRoot.innerHTML = staffTemplate(userData);
//     loadStaffTasks(auth.currentUser);
//     currentView = 'staff-tasks';
// }

// function handleNavigation(button) {
//     // Remove active class from all nav buttons
//     document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
//     button.classList.add('active');
    
//     // Hide all views
//     document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
//     // Show selected view
//     const viewId = button.dataset.view;
//     document.getElementById(viewId + '-view').classList.add('active');
//     currentView = viewId;
    
//     // Load specific content based on view
//     if (viewId === 'admin-performance') {
//         renderPerformanceDashboard();
//     } else if (viewId === 'staff-attendance') {
//         setupAttendancePage();
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
    
//     const taskData = {
//         title: document.getElementById('task-title').value.trim(),
//         assignedToUID: assigneeSelectEl.value,
//         assignedToName: assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text,
//         priority: document.getElementById('task-priority').value,
//         status: 'Pending',
//         createdAt: serverTimestamp(),
//         isRecurring: isRecurring
//     };
    
//     // Only add deadline if provided
//     if (deadlineInput.value) {
//         taskData.deadline = Timestamp.fromDate(new Date(deadlineInput.value));
//     }
    
//     if (!taskData.title || !taskData.assignedToUID) return alert('Title and Assignee are required.');
    
//     try {
//         await addDoc(collection(db, 'tasks'), taskData);
//         alert('Task assigned successfully!');
//         document.getElementById('assign-task-form').reset();
//         document.getElementById('task-recurring').checked = false;
//     } catch (error) {
//         console.error('Error assigning task:', error);
//         alert('Error assigning task. Please try again.');
//     }
// }

// function handleStatusChange(taskId, newStatus) {
//     const taskRef = doc(db, 'tasks', taskId);
//     const updateData = { status: newStatus };
    
//     if (newStatus === 'In Progress' && !updateData.startedAt) updateData.startedAt = serverTimestamp();
//     if (newStatus === 'Completed' && !updateData.completedAt) updateData.completedAt = serverTimestamp();
    
//     updateDoc(taskRef, updateData);
// }

// function populateStaffDropdown() {
//     const assigneeSelect = document.getElementById('task-assignee');
//     onSnapshot(collection(db, 'users'), snapshot => {
//         assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
//         snapshot.forEach(doc => {
//             if (doc.data().role !== 'admin') {
//                 assigneeSelect.innerHTML += `<option value="${doc.id}">${doc.data().name || doc.data().email}</option>`;
//             }
//         });
//     });
// }

// // --- ADMIN TASK LIST (Shows all active tasks, updates instantly when staff completes) ---
// function loadAdminTasks() {
//     const adminTaskList = document.getElementById('admin-task-list');
//     const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'), orderBy('createdAt', 'desc'));
//     onSnapshot(q, snapshot => {
//         adminTaskList.innerHTML = snapshot.empty ? '<p>No active tasks.</p>' : '';
//         snapshot.docs.forEach(doc => renderTaskItem(adminTaskList, { id: doc.id, ...doc.data() }, 'admin'));
//     });
// }

// function loadStaffTasks(user) {
//     const staffTaskList = document.getElementById('staff-task-list');
//     const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid));
    
//     onSnapshot(q, snapshot => {
//         staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
//         const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         tasks.sort((a, b) => (a.createdAt > b.createdAt) ? -1 : 1);
//         tasks.forEach(task => renderTaskItem(staffTaskList, task, 'staff'));
//     });
// }

// function renderTaskItem(container, task, role) {
//     const item = document.createElement('div');
//     item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
//     const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
//     const statusOptions = ['Pending', 'In Progress', 'Completed'];
//     const recurringBadge = task.isRecurring ? '<small style="color: #DCCA87; font-weight: bold;"> [Daily]</small>' : '';
    
//     let actionsHtml = (role === 'staff')
//         ? `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`
//         : `<div class="task-assignee-info">To: ${task.assignedToName}</div><span class="role">${task.status}</span>`;
    
//     item.innerHTML = `<div><div class="task-title">${task.title}${recurringBadge}</div><small>Deadline: ${deadlineText}</small></div><div>${actionsHtml}</div>`;
//     container.appendChild(item);
// }

// // --- 6. RECURRING TASKS ---
// async function checkAndCreateRecurringTasks() {
//     try {
//         const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
//         const today = new Date().toISOString().split('T')[0];
//         if (lastCheck === today) return;

//         const q = query(collection(db, 'tasks'), where('isRecurring', '==', true), where('status', '==', 'Completed'));
//         const snapshot = await getDocs(q);
//         const batch = writeBatch(db);

//         snapshot.forEach(doc => {
//             const task = doc.data();
//             const newDeadline = new Date();
//             newDeadline.setHours(23, 59, 59, 999); // End of today
            
//             const newTask = { 
//                 ...task, 
//                 deadline: Timestamp.fromDate(newDeadline), 
//                 status: 'Pending', 
//                 createdAt: serverTimestamp() 
//             };
//             delete newTask.id; 
//             delete newTask.startedAt; 
//             delete newTask.completedAt;
            
//             const newTaskRef = doc(collection(db, 'tasks'));
//             batch.set(newTaskRef, newTask);
//             batch.update(doc.ref, { isRecurring: false }); // Mark old one as non-recurring to avoid duplication
//         });
        
//         if (!snapshot.empty) await batch.commit();
//         localStorage.setItem('lastRecurringTaskCheck', today);
//     } catch (error) {
//         console.error('Error creating recurring tasks:', error);
//     }
// }

// // --- 7. ATTENDANCE FUNCTIONS ---
// async function handleClockIn() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { clockIn: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error clocking in:', error);
//         alert('Error clocking in. Please try again.');
//     }
// }

// async function handleClockOut() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { clockOut: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error clocking out:', error);
//         alert('Error clocking out. Please try again.');
//     }
// }

// async function handleLunchOut() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { lunchOut: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error marking lunch out:', error);
//         alert('Error marking lunch out. Please try again.');
//     }
// }

// async function handleLunchIn() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { lunchIn: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error marking lunch in:', error);
//         alert('Error marking lunch in. Please try again.');
//     }
// }

// async function handleSnackOut() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { snackOut: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error marking snack out:', error);
//         alert('Error marking snack out. Please try again.');
//     }
// }

// async function handleSnackIn() {
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
//     try {
//         await setDoc(attendanceDocRef, { snackIn: serverTimestamp() }, { merge: true });
//     } catch (error) {
//         console.error('Error marking snack in:', error);
//         alert('Error marking snack in. Please try again.');
//     }
// }

// function setupAttendancePage() {
//     if (currentView !== 'staff-attendance') return;
    
//     const today = new Date().toISOString().split('T')[0];
//     const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    
//     const buttons = {
//         clockIn: document.getElementById('clock-in-btn'), 
//         clockOut: document.getElementById('clock-out-btn'),
//         lunchOut: document.getElementById('lunch-out-btn'), 
//         lunchIn: document.getElementById('lunch-in-btn'),
//         snackOut: document.getElementById('snack-out-btn'), 
//         snackIn: document.getElementById('snack-in-btn')
//     };

//     // Real-time attendance status updates
//     const grid = document.getElementById('attendance-status-grid');
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
        
//         // Button visibility logic
//         if (buttons.clockIn) buttons.clockIn.style.display = data.clockIn ? 'none' : 'inline-flex';
//         if (buttons.clockOut) buttons.clockOut.style.display = (!data.clockIn || data.clockOut) ? 'none' : 'inline-flex';
        
//         // Disable break buttons if not clocked in or already clocked out
//         [buttons.lunchOut, buttons.snackOut].forEach(b => {
//             if (b) {
//                 b.disabled = !data.clockIn || !!data.clockOut;
//                 b.classList.toggle('disabled', !data.clockIn || !!data.clockOut);
//             }
//         });
        
//         // Lunch button visibility
//         if (buttons.lunchOut) buttons.lunchOut.style.display = data.lunchOut ? 'none' : 'inline-flex';
//         if (buttons.lunchIn) buttons.lunchIn.style.display = (!data.lunchOut || data.lunchIn) ? 'none' : 'inline-flex';
        
//         // Snack button visibility
//         if (buttons.snackOut) buttons.snackOut.style.display = data.snackOut ? 'none' : 'inline-flex';
//         if (buttons.snackIn) buttons.snackIn.style.display = (!data.snackOut || data.snackIn) ? 'none' : 'inline-flex';
//     });
    
//     calculateAvgTimes();
// }

// async function calculateAvgTimes() {
//     if (currentView !== 'staff-attendance') return;
    
//     try {
//         const avgGrid = document.getElementById('attendance-avg-grid');
//         if (!avgGrid) return;
        
//         const q = query(collection(db, 'users', auth.currentUser.uid, 'attendance'), limit(30));
//         const snapshot = await getDocs(q);
//         let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
        
//         snapshot.forEach(doc => {
//             const data = doc.data();
//             if (data.lunchIn && data.lunchOut) {
//                 totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000;
//                 lunchCount++;
//             }
//             if (data.snackIn && data.snackOut) {
//                 totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000;
//                 snackCount++;
//             }
//         });
        
//         const avgLunch = lunchCount ? (totalLunchMins / lunchCount).toFixed(0) : 0;
//         const avgSnack = snackCount ? (totalSnackMins / snackCount).toFixed(0) : 0;
        
//         avgGrid.innerHTML = `
//             <div class="stat-card"><h3>Avg. Lunch Time</h3><span class="stat-number">${avgLunch} min</span></div>
//             <div class="stat-card"><h3>Avg. Snack Time</h3><span class="stat-number">${avgSnack} min</span></div>`;
//     } catch (error) {
//         console.error('Error calculating average times:', error);
//     }
// }

// // --- 8. PERFORMANCE DASHBOARD ---
// async function renderPerformanceDashboard() {
//     if (currentView !== 'admin-performance') return;
    
//     try {
//         const container = document.getElementById('performance-table-container');
//         if (!container) return;
        
//         container.innerHTML = `<p>Calculating performance metrics...</p>`;
        
//         const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
//         const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
//         const completedTasks = tasksSnapshot.docs.map(doc => doc.data());

//         let performanceData = [];
        
//         for (const userDoc of usersSnapshot.docs) {
//             const user = userDoc.data();
//             const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid && t.startedAt && t.completedAt);
            
//             const completionTimes = userTasks.map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000); // in hours
//             const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
            
//             // Calculate attendance averages
//             const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), limit(30));
//             const attendanceSnapshot = await getDocs(attendanceQuery);
            
//             let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
//             let inTimeSum = 0, inTimeCount = 0;
            
//             attendanceSnapshot.forEach(doc => {
//                 const data = doc.data();
                
//                 // Calculate lunch and snack averages
//                 if (data.lunchIn && data.lunchOut) {
//                     totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000;
//                     lunchCount++;
//                 }
//                 if (data.snackIn && data.snackOut) {
//                     totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000;
//                     snackCount++;
//                 }
                
//                 // Calculate average in-time (clock-in time)
//                 if (data.clockIn) {
//                     const clockInTime = data.clockIn.toDate();
//                     const hours = clockInTime.getHours();
//                     const minutes = clockInTime.getMinutes();
//                     const timeInMinutes = hours * 60 + minutes;
//                     inTimeSum += timeInMinutes;
//                     inTimeCount++;
//                 }
//             });
            
//             const avgLunchTime = lunchCount ? (totalLunchMins / lunchCount) : 0;
//             const avgSnackTime = snackCount ? (totalSnackMins / snackCount) : 0;
//             const avgInTime = inTimeCount ? (inTimeSum / inTimeCount) : 0;
            
//             // Convert average in-time back to readable format
//             const avgInHours = Math.floor(avgInTime / 60);
//             const avgInMins = Math.round(avgInTime % 60);
//             const avgInTimeFormatted = inTimeCount ? `${avgInHours.toString().padStart(2, '0')}:${avgInMins.toString().padStart(2, '0')}` : '--';
            
//             // Scoring system
//             const punctualityBonus = inTimeCount > 0 && avgInTime <= 540 ? 5 : 0; // Bonus for being on time (9 AM = 540 minutes)
//             const score = (userTasks.length * 10) - avgCompletionHours + punctualityBonus;
            
//             performanceData.push({
//                 name: user.name || user.email,
//                 tasksCompleted: userTasks.length,
//                 avgTime: avgCompletionHours.toFixed(2),
//                 avgLunchTime: avgLunchTime.toFixed(0),
//                 avgSnackTime: avgSnackTime.toFixed(0),
//                 avgInTime: avgInTimeFormatted,
//                 score
//             });
//         }

//         performanceData.sort((a, b) => b.score - a.score);

//         container.innerHTML = `
//             <table class="performance-table">
//                 <thead>
//                     <tr>
//                         <th>Rank</th>
//                         <th>Staff Name</th>
//                         <th>Tasks Completed</th>
//                         <th>Avg. Completion (Hours)</th>
//                         <th>Avg. Lunch Time (Min)</th>
//                         <th>Avg. Snack Time (Min)</th>
//                         <th>Avg. In-Time</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${performanceData.length === 0 ? '<tr><td colspan="7">No completed tasks with performance data yet.</td></tr>' : 
//                       performanceData.map((p, index) => `
//                         <tr>
//                             <td class="rank">#${index + 1}</td>
//                             <td>${p.name}</td>
//                             <td>${p.tasksCompleted}</td>
//                             <td>${p.avgTime}</td>
//                             <td>${p.avgLunchTime}</td>
//                             <td>${p.avgSnackTime}</td>
//                             <td>${p.avgInTime}</td>
//                         </tr>
//                     `).join('')}
//                 </tbody>
//             </table>`;
//     } catch (error) {
//         console.error('Error rendering performance dashboard:', error);
//         const container = document.getElementById('performance-table-container');
//         if (container) {
//             container.innerHTML = `<p>Error loading performance data. Please try again.</p>`;
//         }
//     }
// }
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc, getDocs, limit, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
                <div class="premium-card"><h2 class="section-title">Staff Performance & Rankings</h2><div id="performance-table-container"></div></div>
            </div>
        </main>
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
                <div class="premium-card"><h2 class="section-title">My Tasks</h2><div id="staff-task-list"></div></div>
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
        
        // Navigation buttons
        if (event.target && event.target.classList.contains('nav-btn')) {
            handleNavigation(event.target);
        }
        
        // Attendance buttons
        if (event.target && event.target.id === 'clock-in-btn') handleClockIn();
        if (event.target && event.target.id === 'clock-out-btn') handleClockOut();
        if (event.target && event.target.id === 'lunch-out-btn') handleLunchOut();
        if (event.target && event.target.id === 'lunch-in-btn') handleLunchIn();
        if (event.target && event.target.id === 'snack-out-btn') handleSnackOut();
        if (event.target && event.target.id === 'snack-in-btn') handleSnackIn();
    });
    
    appRoot.addEventListener('change', (event) => {
        if (event.target && event.target.classList.contains('task-status-selector')) {
            handleStatusChange(event.target.dataset.taskid, event.target.value);
        }
        if (event.target && event.target.id === 'staff-selector') {
            loadSelectedStaffTasks(event.target.value);
        }
    });
    
    appRoot.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && event.target.id === 'login-password') {
            handleLogin();
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
    populateStaffSelector();
    loadAdminTasks();
    checkAndCreateRecurringTasks();
    setupPerformanceListener();
    currentView = 'admin-dashboard';
}

function renderStaffDashboard(userData) {
    appRoot.innerHTML = staffTemplate(userData);
    loadStaffTasks(auth.currentUser);
    currentView = 'staff-tasks';
}

function handleNavigation(button) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Show selected view
    const viewId = button.dataset.view;
    document.getElementById(viewId + '-view').classList.add('active');
    currentView = viewId;
    
    // Load specific content based on view
    if (viewId === 'admin-performance') {
        renderPerformanceDashboard();
    } else if (viewId === 'staff-attendance') {
        setupAttendancePage();
    } else if (viewId === 'admin-all-tasks') {
        populateStaffSelector();
    }
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
    const isRecurring = document.getElementById('task-recurring').checked;
    
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        assignedToUID: assigneeSelectEl.value,
        assignedToName: assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text,
        priority: document.getElementById('task-priority').value,
        status: 'Pending',
        createdAt: serverTimestamp(),
        isRecurring: isRecurring
    };
    
    // Only add deadline if provided
    if (deadlineInput.value) {
        taskData.deadline = Timestamp.fromDate(new Date(deadlineInput.value));
    }
    
    if (!taskData.title || !taskData.assignedToUID) return alert('Title and Assignee are required.');
    
    try {
        await addDoc(collection(db, 'tasks'), taskData);
        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
        document.getElementById('task-recurring').checked = false;
    } catch (error) {
        console.error('Error assigning task:', error);
        alert('Error assigning task. Please try again.');
    }
}

function handleStatusChange(taskId, newStatus) {
    const taskRef = doc(db, 'tasks', taskId);
    const updateData = { status: newStatus };
    
    if (newStatus === 'In Progress' && !updateData.startedAt) updateData.startedAt = serverTimestamp();
    if (newStatus === 'Completed' && !updateData.completedAt) updateData.completedAt = serverTimestamp();
    
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

function populateStaffSelector() {
    const staffSelector = document.getElementById('staff-selector');
    if (!staffSelector) return;
    
    onSnapshot(collection(db, 'users'), snapshot => {
        staffSelector.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            if (doc.data().role !== 'admin') {
                staffSelector.innerHTML += `<option value="${doc.id}">${doc.data().name || doc.data().email}</option>`;
            }
        });
    });
}

// --- NEW: Load all tasks for selected staff ---
function loadSelectedStaffTasks(staffUID) {
    const container = document.getElementById('selected-staff-tasks');
    if (!container) return;
    
    if (!staffUID) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Select a staff member to view their tasks</p>';
        return;
    }
    
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', staffUID), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tasks assigned to this staff member</p>';
            return;
        }
        
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const completedTasks = tasks.filter(task => task.status === 'Completed');
        const incompleteTasks = tasks.filter(task => task.status !== 'Completed');
        
        container.innerHTML = `
            <div class="task-section">
                <h3>Incomplete Tasks (${incompleteTasks.length})</h3>
                <div id="incomplete-tasks-list"></div>
            </div>
            <div class="task-section">
                <h3>Completed Tasks (${completedTasks.length})</h3>
                <div id="completed-tasks-list"></div>
            </div>
        `;
        
        const incompleteContainer = document.getElementById('incomplete-tasks-list');
        const completedContainer = document.getElementById('completed-tasks-list');
        
        if (incompleteTasks.length === 0) {
            incompleteContainer.innerHTML = '<p style="color: var(--text-secondary);">No incomplete tasks</p>';
        } else {
            incompleteContainer.innerHTML = '';
            incompleteTasks.forEach(task => renderTaskItem(incompleteContainer, task, 'admin-view'));
        }
        
        if (completedTasks.length === 0) {
            completedContainer.innerHTML = '<p style="color: var(--text-secondary);">No completed tasks</p>';
        } else {
            completedContainer.innerHTML = '';
            completedTasks.forEach(task => renderTaskItem(completedContainer, task, 'admin-view'));
        }
    });
}

// --- ADMIN TASK LIST (Shows all active tasks, updates instantly when staff completes) ---
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
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid));
    
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
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
    const recurringBadge = task.isRecurring ? '<small style="color: #DCCA87; font-weight: bold;"> [Daily]</small>' : '';
    
    let actionsHtml = '';
    if (role === 'staff') {
        actionsHtml = `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
    } else if (role === 'admin') {
        actionsHtml = `<div class="task-assignee-info">To: ${task.assignedToName}</div><span class="role">${task.status}</span>`;
    } else if (role === 'admin-view') {
        actionsHtml = `<span class="role">${task.status}</span>`;
    }
    
    item.innerHTML = `<div><div class="task-title">${task.title}${recurringBadge}</div><small>Deadline: ${deadlineText}</small></div><div>${actionsHtml}</div>`;
    container.appendChild(item);
}

// --- 6. RECURRING TASKS ---
async function checkAndCreateRecurringTasks() {
    try {
        const lastCheck = localStorage.getItem('lastRecurringTaskCheck');
        const today = new Date().toISOString().split('T')[0];
        if (lastCheck === today) return;

        const q = query(collection(db, 'tasks'), where('isRecurring', '==', true), where('status', '==', 'Completed'));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.forEach(doc => {
            const task = doc.data();
            const newDeadline = new Date();
            newDeadline.setHours(23, 59, 59, 999); // End of today
            
            const newTask = { 
                ...task, 
                deadline: Timestamp.fromDate(newDeadline), 
                status: 'Pending', 
                createdAt: serverTimestamp() 
            };
            delete newTask.id; 
            delete newTask.startedAt; 
            delete newTask.completedAt;
            
            const newTaskRef = doc(collection(db, 'tasks'));
            batch.set(newTaskRef, newTask);
            batch.update(doc.ref, { isRecurring: false }); // Mark old one as non-recurring to avoid duplication
        });
        
        if (!snapshot.empty) await batch.commit();
        localStorage.setItem('lastRecurringTaskCheck', today);
    } catch (error) {
        console.error('Error creating recurring tasks:', error);
    }
}

// --- 7. ATTENDANCE FUNCTIONS ---
async function handleClockIn() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { clockIn: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error clocking in:', error);
        alert('Error clocking in. Please try again.');
    }
}

async function handleClockOut() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { clockOut: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error clocking out:', error);
        alert('Error clocking out. Please try again.');
    }
}

async function handleLunchOut() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { lunchOut: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error marking lunch out:', error);
        alert('Error marking lunch out. Please try again.');
    }
}

async function handleLunchIn() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { lunchIn: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error marking lunch in:', error);
        alert('Error marking lunch in. Please try again.');
    }
}

async function handleSnackOut() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { snackOut: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error marking snack out:', error);
        alert('Error marking snack out. Please try again.');
    }
}

async function handleSnackIn() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    try {
        await setDoc(attendanceDocRef, { snackIn: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error('Error marking snack in:', error);
        alert('Error marking snack in. Please try again.');
    }
}

function setupAttendancePage() {
    if (currentView !== 'staff-attendance') return;
    
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', auth.currentUser.uid, 'attendance', today);
    
    const buttons = {
        clockIn: document.getElementById('clock-in-btn'), 
        clockOut: document.getElementById('clock-out-btn'),
        lunchOut: document.getElementById('lunch-out-btn'), 
        lunchIn: document.getElementById('lunch-in-btn'),
        snackOut: document.getElementById('snack-out-btn'), 
        snackIn: document.getElementById('snack-in-btn')
    };

    // Real-time attendance status updates
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
        
        // Button visibility logic
        if (buttons.clockIn) buttons.clockIn.style.display = data.clockIn ? 'none' : 'inline-flex';
        if (buttons.clockOut) buttons.clockOut.style.display = (!data.clockIn || data.clockOut) ? 'none' : 'inline-flex';
        
        // Disable break buttons if not clocked in or already clocked out
        [buttons.lunchOut, buttons.snackOut].forEach(b => {
            if (b) {
                b.disabled = !data.clockIn || !!data.clockOut;
                b.classList.toggle('disabled', !data.clockIn || !!data.clockOut);
            }
        });
        
        // Lunch button visibility
        if (buttons.lunchOut) buttons.lunchOut.style.display = data.lunchOut ? 'none' : 'inline-flex';
        if (buttons.lunchIn) buttons.lunchIn.style.display = (!data.lunchOut || data.lunchIn) ? 'none' : 'inline-flex';
        
        // Snack button visibility
        if (buttons.snackOut) buttons.snackOut.style.display = data.snackOut ? 'none' : 'inline-flex';
        if (buttons.snackIn) buttons.snackIn.style.display = (!data.snackOut || data.snackIn) ? 'none' : 'inline-flex';
    });
    
    calculateAvgTimes();
}

async function calculateAvgTimes() {
    if (currentView !== 'staff-attendance') return;
    
    try {
        const avgGrid = document.getElementById('attendance-avg-grid');
        if (!avgGrid) return;
        
        const q = query(collection(db, 'users', auth.currentUser.uid, 'attendance'), limit(30));
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
    } catch (error) {
        console.error('Error calculating average times:', error);
    }
}

// --- 8. ENHANCED PERFORMANCE DASHBOARD WITH REAL-TIME UPDATES ---
function setupPerformanceListener() {
    // Clean up existing listener
    if (performanceUpdateListener) {
        performanceUpdateListener();
    }
    
    // Set up new listener for real-time performance updates
    const tasksQuery = query(collection(db, 'tasks'));
    performanceUpdateListener = onSnapshot(tasksQuery, () => {
        if (currentView === 'admin-performance') {
            renderPerformanceDashboard();
        }
    });
}

async function renderPerformanceDashboard() {
    if (currentView !== 'admin-performance') return;
    
    try {
        const container = document.getElementById('performance-table-container');
        if (!container) return;
        
        container.innerHTML = `<p>Calculating performance metrics...</p>`;
        
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const completedTasks = allTasks.filter(task => task.status === 'Completed');

        let performanceData = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid && t.startedAt && t.completedAt);
            
            const completionTimes = userTasks.map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000); // in hours
            const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
            
            // Calculate attendance averages
            const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), limit(30));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            
            let totalLunchMins = 0, lunchCount = 0, totalSnackMins = 0, snackCount = 0;
            let inTimeSum = 0, inTimeCount = 0;
            
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                
                // Calculate lunch and snack averages
                if (data.lunchIn && data.lunchOut) {
                    totalLunchMins += (data.lunchIn.toMillis() - data.lunchOut.toMillis()) / 60000;
                    lunchCount++;
                }
                if (data.snackIn && data.snackOut) {
                    totalSnackMins += (data.snackIn.toMillis() - data.snackOut.toMillis()) / 60000;
                    snackCount++;
                }
                
                // Calculate average in-time (clock-in time)
                if (data.clockIn) {
                    const clockInTime = data.clockIn.toDate();
                    const hours = clockInTime.getHours();
                    const minutes = clockInTime.getMinutes();
                    const timeInMinutes = hours * 60 + minutes;
                    inTimeSum += timeInMinutes;
                    inTimeCount++;
                }
            });
            
            const avgLunchTime = lunchCount ? (totalLunchMins / lunchCount) : 0;
            const avgSnackTime = snackCount ? (totalSnackMins / snackCount) : 0;
            const avgInTime = inTimeCount ? (inTimeSum / inTimeCount) : 0;
            
            // Convert average in-time back to readable format
            const avgInHours = Math.floor(avgInTime / 60);
            const avgInMins = Math.round(avgInTime % 60);
            const avgInTimeFormatted = inTimeCount ? `${avgInHours.toString().padStart(2, '0')}:${avgInMins.toString().padStart(2, '0')}` : '--';
            
            // Scoring system
            const punctualityBonus = inTimeCount > 0 && avgInTime <= 540 ? 5 : 0; // Bonus for being on time (9 AM = 540 minutes)
            const score = (userTasks.length * 10) - avgCompletionHours + punctualityBonus;
            
            performanceData.push({
                name: user.name || user.email,
                tasksCompleted: userTasks.length,
                avgTime: avgCompletionHours.toFixed(2),
                avgLunchTime: avgLunchTime.toFixed(0),
                avgSnackTime: avgSnackTime.toFixed(0),
                avgInTime: avgInTimeFormatted,
                score
            });
        }

        performanceData.sort((a, b) => b.score - a.score);

        container.innerHTML = `
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Staff Name</th>
                        <th>Tasks Completed</th>
                        <th>Avg. Completion (Hours)</th>
                        <th>Avg. Lunch Time (Min)</th>
                        <th>Avg. Snack Time (Min)</th>
                        <th>Avg. In-Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${performanceData.length === 0 ? '<tr><td colspan="7">No completed tasks with performance data yet.</td></tr>' : 
                      performanceData.map((p, index) => `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td>${p.name}</td>
                            <td>${p.tasksCompleted}</td>
                            <td>${p.avgTime}</td>
                            <td>${p.avgLunchTime}</td>
                            <td>${p.avgSnackTime}</td>
                            <td>${p.avgInTime}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch (error) {
        console.error('Error rendering performance dashboard:', error);
        const container = document.getElementById('performance-table-container');
        if (container) {
            container.innerHTML = `<p>Error loading performance data. Please try again.</p>`;
        }
    }
}

