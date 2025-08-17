import { auth, db } from './common.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, doc, addDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, setDoc, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Page Protection: Redirects staff or non-logged-in users
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            window.location.href = './staff.html';
        } else {
            initializeAdminDashboard(user, userDoc.data());
        }
    } else {
        window.location.href = './index.html';
    }
});

function initializeAdminDashboard(user, userData) {
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    // View Navigation
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
            document.getElementById(viewId)?.classList.remove('hidden');
            document.getElementById(viewId)?.classList.add('active');
            
            if (viewId === 'admin-performance-view') {
                renderPerformanceDashboard();
            }
        });
    });

    // Populate staff dropdown for task assignment
    const assigneeSelect = document.getElementById('task-assignee');
    onSnapshot(collection(db, 'users'), snapshot => {
        assigneeSelect.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach(doc => {
            const staff = doc.data();
            if (staff.role !== 'admin') {
                assigneeSelect.innerHTML += `<option value="${staff.uid}">${staff.name || staff.email}</option>`;
            }
        });
    });
    
    // Assign Task button logic
    document.getElementById('assign-task-button').addEventListener('click', async () => {
        const assigneeSelectEl = document.getElementById('task-assignee');
        const deadlineInput = document.getElementById('task-deadline');
        const assignedToUID = assigneeSelectEl.value;
        const assignedToName = assigneeSelectEl.options[assigneeSelectEl.selectedIndex].text;
        const taskTitle = document.getElementById('task-title').value;

        if (!taskTitle || !assignedToUID) {
            return alert('Title and Assignee are required.');
        }

        const taskData = {
            title: taskTitle,
            assignedToUID,
            assignedToName,
            priority: document.getElementById('task-priority').value,
            isRecurring: document.getElementById('task-recurring').checked,
            status: 'Pending',
            createdAt: serverTimestamp(),
            deadline: deadlineInput.value ? Timestamp.fromDate(new Date(deadlineInput.value)) : null
        };
        
        const taskRef = await addDoc(collection(db, 'tasks'), taskData);
        await addDoc(collection(db, 'users', assignedToUID, 'notifications'), {
            message: `New task assigned: "${taskData.title}"`,
            isRead: false,
            createdAt: serverTimestamp()
        });
        alert('Task assigned successfully!');
        document.getElementById('assign-task-form').reset();
    });

    // Load All Active Tasks
    const adminTaskList = document.getElementById('admin-task-list');
    const q = query(collection(db, 'tasks'), where('status', '!=', 'Completed'), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        adminTaskList.innerHTML = snapshot.empty ? '<p>No active tasks.</p>' : '';
        snapshot.docs.forEach(doc => {
            const task = doc.data();
            const item = document.createElement('div');
            item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
            const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
            item.innerHTML = `<div><div class="task-title">${task.title}</div><small>To: ${task.assignedToName} | Deadline: ${deadlineText}</small></div><span class="role">${task.status}</span>`;
            adminTaskList.appendChild(item);
        });
    });
    
    // Create Staff Logic
    document.getElementById('create-staff-button').addEventListener('click', async () => {
        const name = document.getElementById('staff-name').value;
        const email = document.getElementById('staff-email').value;
        const password = document.getElementById('staff-password').value;
        if (!name || !email || password.length < 6) return alert('All fields are required. Password must be 6+ characters.');
        
        try {
            const tempApp = initializeApp(firebaseConfig, `Secondary-${new Date().getTime()}`);
            const tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid, name, email, role: 'staff', isActive: true, createdAt: serverTimestamp()
            });
            alert(`Staff account for ${name} created successfully!`);
            document.getElementById('create-staff-form').reset();
            await signOut(tempAuth);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
}

// Renders the Performance Dashboard
async function renderPerformanceDashboard() {
    const container = document.getElementById('performance-table-container');
    container.innerHTML = `<p>Calculating performance metrics...</p>`;
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
    const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
    const completedTasks = tasksSnapshot.docs.map(doc => doc.data());

    let performanceData = [];
    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        
        const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid && t.startedAt && t.completedAt);
        const completionTimes = userTasks.map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000);
        const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), where('clockIn', '>=', thirtyDaysAgo));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        let daysClockedIn = attendanceSnapshot.size;
        
        performanceData.push({
            name: user.name || user.email,
            tasksCompleted: userTasks.length,
            avgTaskTime: avgCompletionHours.toFixed(2),
            attendanceDays: daysClockedIn,
        });
    }

    performanceData.sort((a, b) => b.tasksCompleted - a.tasksCompleted); 

    container.innerHTML = `
        <table class="performance-table">
            <thead><tr><th>Rank</th><th>Staff</th><th>Tasks Done</th><th>Avg. Task Time (Hrs)</th><th>Days Present (Last 30)</th></tr></thead>
            <tbody>
                ${performanceData.map((p, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.tasksCompleted}</td>
                        <td>${p.avgTaskTime}</td>
                        <td>${p.attendanceDays}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// ... (Other functions like recurring tasks if needed)
