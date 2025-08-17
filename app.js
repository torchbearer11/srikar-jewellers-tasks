// --- 1. INITIALIZE FIREBASE (v9+ MODULAR SYNTAX) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    doc, 
    updateDoc, 
    deleteDoc,
    setDoc,
    getDoc,
    where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
    authDomain: "srikar-jewellers-crm.firebaseapp.com",
    projectId: "srikar-jewellers-crm",
    storageBucket: "srikar-jewellers-crm.firebasestorage.app",
    messagingSenderId: "377625912262",
    appId: "1:377625912262:web:d6d05bec0d817e211b48c7",
    measurementId: "G-06K93QM4V4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const tasksCollectionRef = collection(db, 'tasks');
const usersCollectionRef = collection(db, 'users');

// --- 2. GET LOGIN PAGE ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginButton = document.getElementById('login-button');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// --- 3. AUTHENTICATION LOGIC ---
loginButton.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    loginError.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error:", error);
        loginError.textContent = 'Invalid email or password.';
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in, now we can safely find and set up the app elements
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        loginEmail.value = '';
        loginPassword.value = '';

        // Safely set up the dashboard now that it's visible
        setupDashboard(user);
        
    } else {
        // User is logged out
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

// --- 4. SETUP DASHBOARD (NEW FUNCTION) ---
// This function runs ONLY after a successful login.
const setupDashboard = (user) => {
    // Get dashboard elements now, when we know they exist.
    const logoutButton = document.getElementById('logout-button');
    const addTaskButton = document.getElementById('add-task-button');
    
    // Attach event listeners
    logoutButton.addEventListener('click', () => signOut(auth));
    
    addTaskButton.addEventListener('click', async () => {
        const taskTitle = document.getElementById('task-title');
        const taskPriority = document.getElementById('task-priority');
        const taskAssignee = document.getElementById('task-assignee');
        
        const title = taskTitle.value.trim();
        const priority = taskPriority.value;
        const assigneeUid = taskAssignee.value;
        const selectedOption = taskAssignee.options[taskAssignee.selectedIndex];
        const assigneeEmail = selectedOption.dataset.email;

        if (title && assigneeUid) {
            await addDoc(tasksCollectionRef, {
                title, priority, status: 'pending', createdAt: serverTimestamp(),
                assignedToUID: assigneeUid, assignedToEmail: assigneeEmail
            });
            taskTitle.value = '';
            taskAssignee.value = '';
        } else {
            alert('Please provide a task title and select an assignee.');
        }
    });

    // Load user data and tasks
    loadUserDataAndTasks(user);
};

// --- 5. DATA LOADING FUNCTIONS ---
const loadUserDataAndTasks = async (user) => {
    try {
        await saveUserProfile(user);
        const userRole = await getUserRole(user.uid);
        populateUsersDropdown();
        loadTasks(user, userRole);
    } catch (error) {
        console.error("Error loading user data:", error);
        alert(`An error occurred: ${error.message}`);
    }
};

const saveUserProfile = async (user) => {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { uid: user.uid, email: user.email }, { merge: true });
};

const populateUsersDropdown = () => {
    const taskAssignee = document.getElementById('task-assignee');
    onSnapshot(usersCollectionRef, (snapshot) => {
        taskAssignee.innerHTML = '<option value="">Select Staff Member...</option>';
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

const getUserRole = async (uid) => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) throw new Error("User profile not found in database.");
    return (docSnap.data().role) ? docSnap.data().role : 'staff';
};

const loadTasks = (user, userRole) => {
    const taskList = document.getElementById('task-list');
    const q = (userRole === 'admin')
        ? query(tasksCollectionRef, orderBy('createdAt', 'desc'))
        : query(tasksCollectionRef, where('assignedToUID', '==', user.uid), orderBy('deadline', 'asc'));

    onSnapshot(q, (snapshot) => {
        taskList.innerHTML = snapshot.empty ? `<p style="text-align:center;">No tasks found.</p>` : '';
        snapshot.forEach((docSnap) => {
            const task = docSnap.data();
            const taskId = docSnap.id;
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.priority} ${task.status}`;
            taskElement.innerHTML = `
                <div class="task-main-content">
                    <span class="task-title-text">${task.title}</span>
                    <div class="task-actions">
                        <button class="btn complete-btn">${task.status === 'pending' ? 'Complete' : 'Undo'}</button>
                        <button class="btn btn-danger delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                ${task.assignedToEmail ? `<div class="task-assignee-info"><i class="fas fa-user-check"></i> Assigned to: ${task.assignedToEmail}</div>` : ''}
            `;

            const taskDocRef = doc(db, 'tasks', taskId);
            taskElement.querySelector('.complete-btn').addEventListener('click', () => updateDoc(taskDocRef, { status: task.status === 'pending' ? 'completed' : 'pending' }));
            taskElement.querySelector('.delete-btn').addEventListener('click', () => { if(confirm('Are you sure?')) deleteDoc(taskDocRef); });
            taskList.appendChild(taskElement);
        });
    }, (error) => {
        console.error("Error in task listener:", error);
        alert(`A database error occurred: ${error.message}`);
    });
};
