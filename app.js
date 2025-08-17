// --- 1. INITIALIZE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- 2. GET LOGIN PAGE ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginButton = document.getElementById('login-button');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// --- 3. AUTHENTICATION ---
loginButton.addEventListener('click', async () => {
    loginError.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    } catch (error) {
        loginError.textContent = 'Invalid email or password.';
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        setupDashboard(user);
    } else {
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

// --- 4. DASHBOARD SETUP ---
const setupDashboard = (user) => {
    const logoutButton = document.getElementById('logout-button');
    const addTaskButton = document.getElementById('add-task-button');

    logoutButton.addEventListener('click', () => signOut(auth));

    addTaskButton.addEventListener('click', async () => {
        const taskTitleInput = document.getElementById('task-title');
        const taskPriorityInput = document.getElementById('task-priority');
        const taskAssigneeInput = document.getElementById('task-assignee');
        
        const assigneeUid = taskAssigneeInput.value;
        const selectedOption = taskAssigneeInput.options[taskAssigneeInput.selectedIndex];

        if (taskTitleInput.value.trim() && assigneeUid) {
            await addDoc(collection(db, 'tasks'), {
                title: taskTitleInput.value.trim(),
                priority: taskPriorityInput.value,
                status: 'pending',
                createdAt: serverTimestamp(),
                assignedToUID: assigneeUid,
                assignedToEmail: selectedOption.dataset.email
            });
            taskTitleInput.value = '';
        } else {
            alert('Please provide a task title and select an assignee.');
        }
    });

    loadUserDataAndTasks(user);
};

// --- 5. DATA LOADING ---
const loadUserDataAndTasks = async (user) => {
    try {
        await saveUserProfile(user);
        const userRole = await getUserRole(user.uid);
        populateUsersDropdown();
        loadTasks(user, userRole);
    } catch (error) {
        alert(`An critical error occurred: ${error.message}`);
        signOut(auth);
    }
};

const saveUserProfile = async (user) => {
    await setDoc(doc(db, 'users', user.uid), { uid: user.uid, email: user.email }, { merge: true });
};

const getUserRole = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
        throw new Error("Your user profile was not found in the database. Please contact an admin.");
    }
    return userDoc.data().role || 'staff';
};

const populateUsersDropdown = () => {
    const taskAssignee = document.getElementById('task-assignee');
    onSnapshot(collection(db, 'users'), (snapshot) => {
        taskAssignee.innerHTML = '<option value="">Select Staff...</option>';
        snapshot.forEach((doc) => {
            const user = doc.data();
            const option = document.createElement('option');
            option.value = user.uid;
            option.textContent = user.email;
            option.dataset.email = user.email;
            taskAssignee.appendChild(option);
        });
    });
};

const loadTasks = (user, userRole) => {
    const taskList = document.getElementById('task-list');
    const q = (userRole === 'admin')
        ? query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'tasks'), where('assignedToUID', '==', user.uid), orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        taskList.innerHTML = snapshot.empty ? `<p style="text-align:center;">No tasks found.</p>` : '';
        snapshot.forEach((docSnap) => {
            const task = docSnap.data();
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.priority} ${task.status}`;
            taskElement.innerHTML = `
                <div class="task-main-content">
                    <span class="task-title-text">${task.title}</span>
                    <div class="task-actions">
                        <button class="btn complete-btn">${task.status === 'pending' ? 'Mark Complete' : 'Undo'}</button>
                    </div>
                </div>
                <div class="task-assignee-info">
                    <i class="fas fa-user-check"></i> Assigned to: ${task.assignedToEmail}
                </div>`;

            const completeBtn = taskElement.querySelector('.complete-btn');
            if (task.status === 'completed') {
                completeBtn.classList.add('btn-secondary');
                completeBtn.classList.remove('btn-primary');
            }
            
            completeBtn.addEventListener('click', () => {
                const newStatus = task.status === 'pending' ? 'completed' : 'pending';
                updateDoc(doc(db, 'tasks', docSnap.id), { status: newStatus });
            });
            taskList.appendChild(taskElement);
        });
    });
};
