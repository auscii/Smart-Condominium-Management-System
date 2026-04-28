// Firebase configuration
// Replace these values with your Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyASLxsDJT6UgpDFvcfUsq4sKBt50vRNbiU",
    authDomain: "easy-stay-smart-condo.firebaseapp.com",
    projectId: "easy-stay-smart-condo",
    storageBucket: "easy-stay-smart-condo.firebasestorage.app",
    messagingSenderId: "1081657459633",
    appId: "1:1081657459633:web:887de62dd387b496fd3390"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Authentication
const auth = firebase.auth();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed: multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Firestore persistence is not available in this environment');
        }
    });

// Set up auth state persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error('Auth persistence error:', error);
    });

// Export for use in other scripts
window.db = db;
window.auth = auth;

console.log('Firebase initialized successfully');

