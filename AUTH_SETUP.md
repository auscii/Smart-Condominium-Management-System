# 🔐 Authentication Setup Guide

## Overview

This project uses **Firebase Authentication** for user sign-in and **Firestore** for storing user profiles and data.

## Features

- **Email/Password Authentication** - Standard login with email and password
- **User Registration** - New users can create accounts
- **Secure Sessions** - "Remember me" option for persistent login
- **User Profiles** - Store additional user info in Firestore (unit number, phone, role)
- **Password Reset** - Forgot password functionality
- **Real-time Auth State** - Auto-login if already authenticated

## Files Added/Modified

### New Files
- `signup.html` - User registration page
- `auth-styles.css` - Authentication page styling
- `auth-script.js` - Registration logic

### Modified Files
- `index.html` - Added Firebase Auth, updated login form fields (removed hardcoded credentials)
- `script.js` - Added Firebase Auth integration with proper login/logout
- `firebase-config.js` - Added Auth initialization

## Setup Instructions

### 1. Enable Email/Password Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build > Authentication**
4. Click **Get started**
5. Go to **Sign-in method** tab
6. Click **Email/Password** 
7. Toggle **Enable** to ON
8. Click **Save**

### 2. (Optional) Create Test Users

**Option A: Via Firebase Console**
1. In Authentication section, go to **Users** tab
2. Click **Add user**
3. Enter email and password (min 6 characters)
4. Click **Add user**

**Option B: Via Sign-up Page**
- Users can create accounts at `signup.html`
- First user becomes the admin (you'll need to set admin flag manually in Firestore)

### 3. Test Login

**Default test accounts (if created via console):**
- Email: `resident@condo.com`
- Password: Whatever you set

**Or create a new account:**
1. Open `signup.html` in browser
2. Fill in the form
3. Login at `index.html` with new credentials

## User Data Structure

### Firebase Auth User
```javascript
{
    uid: "unique-id",
    email: "user@example.com",
    displayName: "John Doe",
    emailVerified: false,
    photoURL: null
}
```

### Firestore User Profile
Collection: `users`
```javascript
{
    uid: "matches-auth-uid",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    unitNumber: "1204",      // Optional
    phone: "+63 912 3456789", // Optional
    role: "resident",        // or "admin", "staff"
    createdAt: Timestamp,
    lastLogin: Timestamp
}
```

## How It Works

### Login Flow
1. User enters email/password
2. Firebase Auth verifies credentials
3. `onAuthStateChanged` fires
4. Loads user profile from Firestore (if exists)
5. Shows main app with user's name/unit

### Signup Flow
1. User fills registration form
2. Firebase creates Auth user
3. User profile saved to Firestore
4. Auto-redirect to login page

### Logout Flow
1. User clicks logout
2. Firebase signs out
3. Clears session storage
4. Returns to login screen

## Customization

### Change Default Role
Edit `auth-script.js` line ~63:
```javascript
role: 'resident', // Change to 'admin', 'staff', etc.
```

### Add Email Verification
In `auth-script.js`, add after successful signup:
```javascript
user.sendEmailVerification().then(() => {
    showToast('✅ Verification email sent!', 'success');
});
```

### Add Admin-Only Users
Add a field in Firestore Users collection:
```javascript
{
    isAdmin: true
}
```
Then check in script:
```javascript
if (userData.isAdmin) {
    // Show admin features
}
```

## Firestore Security Rules for Auth

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all user profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Reservations: users can only create/read their own
    match /reservations/{reservationId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
    }

    // Maintenance: users can only create their own
    match /maintenance_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
    }

    // Public read for announcements
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Admin Setup

1. Create first user via signup
2. Go to Firestore Console > `users` collection
3. Find user's document
4. Add field: `role` with value `admin`
5. (Optional) Add `isAdmin: true` for Firebase custom claims

## Troubleshooting

**"Enable Email/Password" error**
- Enable Email/Password auth in Firebase Console (see step 1 above)

**"Invalid-api-key" error**
- Check `firebase-config.js` has correct API key
- Ensure Firebase project is properly set up

**"User not found" after signup**
- Check Firestore write rules allow unauthenticated writes
- Or sign in first, then create profile via app

**Session not persisting**
- Check browser cookies are enabled
- Verify persistence level in `firebase-config.js`

## Demo Credentials (After Creating User)

After creating a user in Firebase Console:
```
Email: your-email@example.com
Password: whatever-you-set
```

**Remember:** For production, implement proper user onboarding and validation.
