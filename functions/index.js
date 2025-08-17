const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// MODIFIED: This function now accepts and saves a unique username.
exports.createNewUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const callerDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
  if (callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can create new users.");
  }

  const { email, password, username } = data;
  const cleanedUsername = username.toLowerCase();

  // Check if username already exists
  const usernameSnapshot = await admin.firestore().collection("users").where("username", "==", cleanedUsername).get();
  if (!usernameSnapshot.empty) {
    throw new functions.https.HttpsError("already-exists", "This username is already taken.");
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      role: "staff",
      username: cleanedUsername,
    });
    return { result: `Successfully created user ${email}` };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// NEW: This function securely finds a user's email from their username.
exports.getEmailFromUsername = functions.https.onCall(async (data, context) => {
  const { username } = data;
  const cleanedUsername = username.toLowerCase();
  
  const snapshot = await admin.firestore().collection("users").where("username", "==", cleanedUsername).limit(1).get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError("not-found", "No user found with that username.");
  }

  const user = snapshot.docs[0].data();
  return { email: user.email };
});
