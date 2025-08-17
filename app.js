// // --- 1. INITIALIZE FIREBASE (v9+ MODULAR SYNTAX) ---
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { 
//     getAuth, 
//     signInWithEmailAndPassword, 
//     signOut, 
//     onAuthStateChanged 
// } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { 
//     getFirestore, 
//     collection, 
//     addDoc, 
//     onSnapshot, 
//     query, 
//     orderBy, 
//     serverTimestamp, 
//     doc, 
//     updateDoc, 
//     deleteDoc,
//     setDoc, // NEW: Import setDoc for user profiles
//     getDocs // NEW: Import getDocs to fetch users
// } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBJkFO2l12n4hKLbNd1vEMgz87GFzH77lg",
//     authDomain: "srikar-jewellers-crm.firebaseapp.com",
//     projectId: "srikar-jewellers-crm",
//     storageBucket: "srikar-jewellers-crm.firebasestorage.app",
//     messagingSenderId: "377625912262",
//     appId: "1:377625912262:web:d6d05bec0d817e211b48c7",
//     measurementId: "G-06K93QM4V4"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const tasksCollectionRef = collection(db, 'tasks');
// const usersCollectionRef = collection(db, 'users'); // NEW: Reference to users collection

// // --- 2. GET DOM ELEMENTS ---
// const loginScreen = document.getElementById('login-screen');
// const appScreen = document.getElementById('app-screen');
// const loginButton = document.getElementById('login-button');
// const logoutButton = document.getElementById('logout-button');
// const loginEmail = document.getElementById('login-email');
// const loginPassword = document.getElementById('login-password');
// const loginError = document.getElementById('login-error');
// const addTaskButton = document.getElementById('add-task-button');
// const taskTitle = document.getElementById('task-title');
// const taskPriority = document.getElementById('task-priority');
// const taskAssignee = document.getElementById('task-assignee'); // NEW: Get assignee dropdown
// const taskList = document.getElementById('task-list');


// // --- 3. AUTHENTICATION LOGIC ---
// loginButton.addEventListener('click', async () => {
//     const email = loginEmail.value;
//     const password = loginPassword.value;
//     loginError.textContent = '';
//     try {
//         await signInWithEmailAndPassword(auth, email, password);
//     } catch (error) {
//         console.error("Login Error:", error);
//         loginError.textContent = 'Invalid email or password.';
//     }
// });

// logoutButton.addEventListener('click', () => {
//     signOut(auth);
// });

// onAuthStateChanged(auth, user => {
//     if (user) {
//         loginScreen.classList.add('hidden');
//         appScreen.classList.remove('hidden');
//         loginEmail.value = '';
//         loginPassword.value = '';
        
//         // NEW: When user logs in, save their profile and populate dropdowns
//         saveUserProfile(user);
//         populateUsersDropdown();
//         loadTasks();
//     } else {
//         loginScreen.classList.remove('hidden');
//         appScreen.classList.add('hidden');
//         taskList.innerHTML = '';
//     }
// });

// // --- NEW: USER MANAGEMENT ---

// // Saves or updates a user's profile in the 'users' collection
// const saveUserProfile = async (user) => {
//     const userDocRef = doc(db, 'users', user.uid);
//     try {
//         await setDoc(userDocRef, {
//             uid: user.uid,
//             email: user.email
//         }, { merge: true }); // merge:true prevents overwriting existing data
//     } catch (error) {
//         console.error("Error saving user profile:", error);
//     }
// };

// // Fetches all users and populates the "Assign To" dropdown
// const populateUsersDropdown = async () => {
//     taskAssignee.innerHTML = '<option value="">Select Staff Member...</option>'; // Reset
//     try {
//         const querySnapshot = await getDocs(usersCollectionRef);
//         querySnapshot.forEach((doc) => {
//             const user = doc.data();
//             const option = document.createElement('option');
//             option.value = user.uid;
//             option.textContent = user.email;
//             // Store email in a data attribute for later use
//             option.dataset.email = user.email;
//             taskAssignee.appendChild(option);
//         });
//     } catch (error) {
//         console.error("Error getting users:", error);
//     }
// };

// // --- 4. TASK MANAGEMENT (CRUD) ---
// addTaskButton.addEventListener('click', async () => {
//     const title = taskTitle.value.trim();
//     const priority = taskPriority.value;
//     const assigneeUid = taskAssignee.value;
//     const selectedOption = taskAssignee.options[taskAssignee.selectedIndex];
//     const assigneeEmail = selectedOption.dataset.email;

//     if (title && assigneeUid) { // MODIFIED: Check if assignee is selected
//         try {
//             await addDoc(tasksCollectionRef, {
//                 title: title,
//                 priority: priority,
//                 status: 'pending',
//                 createdAt: serverTimestamp(),
//                 assignedToUID: assigneeUid,     // MODIFIED: Save UID
//                 assignedToEmail: assigneeEmail  // MODIFIED: Save Email
//             });
//             taskTitle.value = '';
//             taskAssignee.value = '';
//         } catch (error) {
//             console.error("Error adding task: ", error);
//         }
//     } else {
//         alert('Please provide a task title and select an assignee.');
//     }
// });

// const loadTasks = () => {
//     const q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

//     onSnapshot(q, (snapshot) => {
//         if (snapshot.empty) {
//             taskList.innerHTML = `<p style="text-align:center;">No tasks found. Add a new task to get started!</p>`;
//             return;
//         }
        
//         taskList.innerHTML = '';
//         snapshot.forEach((docSnap) => {
//             const task = docSnap.data();
//             const taskId = docSnap.id;
            
//             const taskElement = document.createElement('div');
//             taskElement.className = `task-item ${task.priority} ${task.status}`;

//             // MODIFIED: Updated HTML structure to include assignee info
//             taskElement.innerHTML = `
//                 <div class="task-main-content">
//                     <span class="task-title-text">${task.title}</span>
//                     <div class="task-actions">
//                         <button class="btn complete-btn">${task.status === 'pending' ? 'Complete' : 'Undo'}</button>
//                         <button class="btn btn-danger delete-btn"><i class="fas fa-trash"></i></button>
//                     </div>
//                 </div>
//                 ${task.assignedToEmail ? `<div class="task-assignee-info"><i class="fas fa-user-check"></i> Assigned to: ${task.assignedToEmail}</div>` : ''}
//             `;

//             const taskDocRef = doc(db, 'tasks', taskId);

//             taskElement.querySelector('.complete-btn').addEventListener('click', async () => {
//                 const newStatus = task.status === 'pending' ? 'completed' : 'pending';
//                 await updateDoc(taskDocRef, { status: newStatus });
//             });

//             taskElement.querySelector('.delete-btn').addEventListener('click', async () => {
//                 if(confirm('Are you sure you want to delete this task?')) {
//                     await deleteDoc(taskDocRef);
//                 }
//             });

//             taskList.appendChild(taskElement);
//         });
//     });
// };
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
    getDocs,
    getDoc,
    where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";

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
const functions = getFunctions(app);
const tasksCollectionRef = collection(db, 'tasks');
const usersCollectionRef = collection(db, 'users');

// --- 2. GET DOM ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginUsername = document.getElementById('login-username'); // MODIFIED
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const addTaskButton = document.getElementById('add-task-button');
const taskTitle = document.getElementById('task-title');
const taskPriority = document.getElementById('task-priority');
const taskAssignee = document.getElementById('task-assignee');
const taskList = document.getElementById('task-list');

// Admin Panel Elements
const adminPanel = document.getElementById('admin-panel');
const createStaffButton = document.getElementById('create-staff-button');
const newStaffUsername = document.getElementById('new-staff-username'); // NEW
const newStaffEmail = document.getElementById('new-staff-email');
const newStaffPassword = document.getElementById('new-staff-password');
const staffList = document.getElementById('staff-list');

// --- 3. AUTHENTICATION LOGIC (MODIFIED FOR USERNAME LOGIN) ---
loginButton.addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    loginError.textContent = '';

    if (!username || !password) {
        loginError.textContent = 'Please enter username and password.';
        return;
    }

    try {
        // Step 1: Call cloud function to get email from username
        const getEmail = httpsCallable(functions, 'getEmailFromUsername');
        const result = await getEmail({ username });
        const email = result.data.email;

        // Step 2: Sign in with the retrieved email and provided password
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error:", error);
        if (error.code === 'functions/not-found') {
            loginError.textContent = 'Username not found.';
        } else if (error.code === 'auth/wrong-password') {
            loginError.textContent = 'Incorrect password.';
        } else {
            loginError.textContent = 'An error occurred during login.';
        }
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        loginUsername.value = '';
        loginPassword.value = '';
        
        await saveUserProfile(user);
        const userRole = await getUserRole(user.uid);
        
        if (userRole === 'admin') {
            adminPanel.classList.remove('hidden');
            loadStaffList();
        } else {
            adminPanel.classList.add('hidden');
        }

        populateUsersDropdown(userRole, user.uid); // Pass role and uid
        loadTasks(user, userRole);
    } else {
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        taskList.innerHTML = '';
        adminPanel.classList.add('hidden');
    }
});

// --- 4. USER MANAGEMENT & ADMIN FEATURES ---
createStaffButton.addEventListener('click', async () => {
    const username = newStaffUsername.value.trim();
    const email = newStaffEmail.value.trim();
    const password = newStaffPassword.value;

    if (!username || !email || password.length < 6) {
        alert("Please fill all fields. Password must be at least 6 characters.");
        return;
    }

    const createNewUser = httpsCallable(functions, 'createNewUser');
    try {
        const result = await createNewUser({ username, email, password });
        alert(result.data.result);
        newStaffUsername.value = '';
        newStaffEmail.value = '';
        newStaffPassword.value = '';
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

const saveUserProfile = async (user) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await setDoc(userDocRef, { uid: user.uid, email: user.email }, { merge: true });
    } catch (error) {
        console.error("Error saving user profile:", error);
    }
};

const populateUsersDropdown = (userRole, currentUid) => { // MODIFIED
    onSnapshot(usersCollectionRef, (snapshot) => {
        taskAssignee.innerHTML = '<option value="">Select Staff Member...</option>';
        snapshot.forEach((doc) => {
            const user = doc.data();
            const option = document.createElement('option');
            option.value = user.uid;
            option.textContent = user.username || user.email; // Display username if available
            option.dataset.email = user.email;
            taskAssignee.appendChild(option);
        });
        
        // UX IMPROVEMENT: If user is staff, default to themself
        if (userRole === 'staff') {
            taskAssignee.value = currentUid;
        }
    });
};

const getUserRole = async (uid) => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    return (docSnap.exists() && docSnap.data().role) ? docSnap.data().role : 'staff';
};

const loadStaffList = () => {
    onSnapshot(usersCollectionRef, (snapshot) => {
        staffList.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const staffItem = document.createElement('div');
            staffItem.className = 'staff-item';
            staffItem.innerHTML = `
                <span class="email">${user.username} (${user.email})</span>
                <span class="role">${user.role || 'staff'}</span>
            `;
            staffList.appendChild(staffItem);
        });
    });
};

// --- 5. TASK MANAGEMENT (CRUD) ---
addTaskButton.addEventListener('click', async () => {
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
        if (auth.currentUser) {
            const userRole = await getUserRole(auth.currentUser.uid);
            if (userRole === 'admin') taskAssignee.value = ''; // Reset for admin
        }
    } else {
        alert('Please provide a task title and select an assignee.');
    }
});

const loadTasks = (user, userRole) => {
    let q = (userRole === 'admin')
        ? query(tasksCollectionRef, orderBy('createdAt', 'desc'))
        : query(tasksCollectionRef, where('assignedToUID', '==', user.uid), orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            taskList.innerHTML = `<p style="text-align:center;">No tasks found.</p>`;
            return;
        }
        taskList.innerHTML = '';
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
                ${task.assignedToEmail ? `<div class="task-assignee-info"><i class="fas fa-user-check"></i> Assigned to: ${task.assignedToUsername || task.assignedToEmail}</div>` : ''}
            `;

            const taskDocRef = doc(db, 'tasks', taskId);
            taskElement.querySelector('.complete-btn').addEventListener('click', () => updateDoc(taskDocRef, { status: task.status === 'pending' ? 'completed' : 'pending' }));
            taskElement.querySelector('.delete-btn').addEventListener('click', () => { if(confirm('Are you sure?')) deleteDoc(taskDocRef); });
            taskList.appendChild(taskElement);
        });
    });
};
