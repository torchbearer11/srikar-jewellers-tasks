import { auth, db } from './common.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, doc, addDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Page Protection and Initialization
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'staff';
        if (role !== 'admin') {
            window.location.href = './staff.html'; // Redirect non-admins
        } else {
            initializeAdminDashboard(user, userDoc.data());
        }
    } else {
        window.location.href = './index.html'; // Redirect if not logged in
    }
});

const initializeAdminDashboard = (user, userData) => {
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    // View navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            views.forEach(v => v.classList.add('hidden'));
            document.getElementById(btn.dataset.view)?.classList.remove('hidden');
        });
    });

    // --- Task Assignment Logic ---
    const assignTaskButton = document.getElementById('assign-task-button');
    assignTaskButton.addEventListener('click', async () => { /* ... same as before ... */ });
    onSnapshot(collection(db, 'users'), snapshot => { /* ... populate staff dropdown ... */ });
    onSnapshot(query(collection(db, 'tasks'), where('status', '!=', 'Completed')), snapshot => { /* ... load admin tasks ... */ });

    // --- Performance View Logic ---
    document.querySelector('[data-view="admin-performance-view"]').addEventListener('click', renderPerformanceDashboard);
};

// --- RENDER PERFORMANCE DASHBOARD (UPGRADED) ---
const renderPerformanceDashboard = async () => {
    const container = document.getElementById('performance-table-container');
    container.innerHTML = `<p>Calculating performance metrics...</p>`;
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'staff')));
    const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'Completed')));
    const completedTasks = tasksSnapshot.docs.map(doc => doc.data());

    let performanceData = [];
    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        
        // Task Metrics
        const userTasks = completedTasks.filter(t => t.assignedToUID === user.uid && t.startedAt && t.completedAt);
        const completionTimes = userTasks.map(t => (t.completedAt.toMillis() - t.startedAt.toMillis()) / 3600000); // hours
        const avgCompletionHours = completionTimes.length ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
        
        // Attendance Metrics
        const attendanceQuery = query(collection(db, 'users', user.uid, 'attendance'), limit(30));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        let daysClockedIn = attendanceSnapshot.size;
        let totalWorkHours = 0;
        attendanceSnapshot.forEach(doc => {
            const att = doc.data();
            if (att.clockIn && att.clockOut) {
                totalWorkHours += (att.clockOut.toMillis() - att.clockIn.toMillis()) / 3600000;
            }
        });
        const avgWorkHours = daysClockedIn ? (totalWorkHours / daysClockedIn) : 0;

        performanceData.push({
            name: user.name || user.email,
            tasksCompleted: userTasks.length,
            avgTaskTime: avgCompletionHours.toFixed(2),
            attendancePercentage: ((daysClockedIn / 30) * 100).toFixed(0),
            avgWorkHours: avgWorkHours.toFixed(2),
        });
    }

    // Simple ranking based on tasks completed
    performanceData.sort((a, b) => b.tasksCompleted - a.tasksCompleted); 

    container.innerHTML = `
        <table class="performance-table">
            <thead><tr><th>Rank</th><th>Staff</th><th>Tasks Done</th><th>Avg. Task Time (Hrs)</th><th>Attendance (30d)</th><th>Avg. Work Day (Hrs)</th></tr></thead>
            <tbody>
                ${performanceData.map((p, index) => `
                    <tr>
                        <td class="rank">#${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.tasksCompleted}</td>
                        <td>${p.avgTaskTime}</td>
                        <td>${p.attendancePercentage}%</td>
                        <td>${p.avgWorkHours}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
};

// ... (Other admin helper functions like task rendering, recurring tasks check, etc.)
