import { auth, db } from './common.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, doc, onSnapshot, query, where, orderBy, updateDoc, writeBatch, getDocs, limit, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            window.location.href = './admin.html';
        } else {
            initializeStaffDashboard(user, userDoc.exists() ? userDoc.data() : { email: user.email });
        }
    } else {
        window.location.href = './index.html';
    }
});

function initializeStaffDashboard(user, userData) {
    document.getElementById('header-subtitle').textContent = `Welcome, ${userData.name || user.email}`;
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    
    // View navigation
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
        });
    });

    // Load staff tasks
    const staffTaskList = document.getElementById('staff-task-list');
    const q = query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        staffTaskList.innerHTML = snapshot.empty ? '<p>You have no tasks assigned.</p>' : '';
        snapshot.docs.forEach(doc => renderTaskItem(staffTaskList, { id: doc.id, ...doc.data() }));
    });
    
    setupNotifications(user);
    setupAttendancePage(user);
}

function renderTaskItem(container, task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.priority.replace(' ', '-')} ${task.status}`;
    const deadlineText = task.deadline ? task.deadline.toDate().toLocaleString('en-IN') : 'No deadline';
    const statusOptions = ['Pending', 'Started', 'In Progress', 'Completed'];
    
    let actionsHtml = `<select class="task-status-selector" data-taskid="${task.id}">${statusOptions.map(opt => `<option value="${opt}" ${task.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;

    item.innerHTML = `<div><div class="task-title">${task.title}</div><small>Deadline: ${deadlineText}</small></div><div>${actionsHtml}</div>`;
    container.appendChild(item);

    item.querySelector('.task-status-selector').addEventListener('change', e => {
        const newStatus = e.target.value;
        const taskRef = doc(db, 'tasks', task.id);
        const updateData = { status: newStatus };
        if (newStatus === 'Started' && !task.startedAt) updateData.startedAt = serverTimestamp();
        if (newStatus === 'Completed' && !task.completedAt) updateData.completedAt = serverTimestamp();
        updateDoc(taskRef, updateData);
    });
}

function setupNotifications(user) {
    const bellContainer = document.getElementById('notification-bell-container');
    if(!bellContainer) return;
    bellContainer.innerHTML = `<button id="notification-bell" class="notification-bell"><i class="fas fa-bell"></i><span id="notification-dot" class="notification-dot"></span></button>`;
    
    const bell = document.getElementById('notification-bell');
    const dot = document.getElementById('notification-dot');
    const panel = document.getElementById('notification-panel');

    const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
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
            const notifsRef = collection(db, 'users', user.uid, 'notifications');
            const unreadQuery = query(notifsRef, where('isRead', '==', false));
            const unreadSnapshot = await getDocs(unreadQuery);
            const batch = writeBatch(db);
            unreadSnapshot.forEach(doc => batch.update(doc.ref, { isRead: true }));
            await batch.commit();
        }
    });
}

function setupAttendancePage(user) {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocRef = doc(db, 'users', user.uid, 'attendance', today);
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
    
    calculateAvgTimes(user);
}

async function calculateAvgTimes(user) {
    const avgGrid = document.getElementById('attendance-avg-grid');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const q = query(collection(db, 'users', user.uid, 'attendance'), where('clockIn', '>=', thirtyDaysAgo));
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
}
