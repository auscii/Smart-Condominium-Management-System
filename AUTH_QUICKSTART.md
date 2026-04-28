# 🔐 Authentication System - Quick Start

## What Was Added

### New Files
1. **`signup.html`** - User registration page
2. **`auth-styles.css`** - Login/signup styling
3. **`auth-script.js`** - Registration logic with validation
4. **`AUTH_SETUP.md`** - Complete setup documentation

### Modified Files
- **`index.html`** - Removed hardcoded credentials, added Firebase Auth, dynamic user profile display
- **`script.js`** - Added Firebase Authentication integration with secure login/logout, real-time user data loading
- **`firebase-config.js`** - Added Auth initialization

## How to Use

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication > Sign-in method**
4. Enable **Email/Password**

### Step 2: Create First Admin User

**Option A: Via Firebase Console**
```
1. Authentication > Users > Add user
2. Email: admin@condo.com
3. Password: (your choice, min 6 chars)
```

**Option B: Via Sign-up Page**
```
1. Open signup.html
2. Create account
3. Manually set role="admin" in Firestore users/ document
```

### Step 3: Test Login

Visit `index.html` and login with your created credentials:

```
Email: admin@condo.com
Password: (what you set)
```

**Successful login shows:**
- User's name/unit in top-right profile
- "Sign In" button replaced with "Sign Out" working
- User's private data loads from Firestore

### Step 4: Logout

Click **Logout** in sidebar footer → Signs out via Firebase Auth, returns to login screen.

## Key Features Implemented

| Feature | Description |
|---------|-------------|
| **Secure Login** | Firebase Auth with email/password |
| **Session Persistence** | "Remember me" checkbox controls session vs localStorage |
| **Sign Up** | Full registration form at `signup.html` |
| **Forgot Password** | Link sends reset email |
| **User Profiles** | Stored in Firestore `users` collection |
| **Real-time Auth State** | Auto-login if already signed in |
| **Error Handling** | Clear error messages for wrong password, email not found, etc. |
| **Loading States** | Button spinner during login/signup |
| **Toast Notifications** | Success/error feedback instead of alerts |

## User Flow

```
1. Visitor opens index.html
   ↓
2. Sees login screen (if not authenticated)
   ↓
3. Clicks "Sign up" → Opens signup.html
   ↓
4. Creates account → Saves to Firebase Auth + Firestore
   ↓
5. Redirected to index.html login
   ↓
6. Logs in → Firebase verifies credentials
   ↓
7. onAuthStateChanged fires → Loads user profile
   ↓
8. Main app opens with user's name displayed
   ↓
9. Can now book facilities, submit requests, etc. (all tied to user ID)
```

## Database Structure

### `users` Collection
```javascript
{
    uid: "firebase-auth-uid",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    unitNumber: "1204",
    phone: "+63 912 345 6789",
    role: "resident", // or "admin"
    createdAt: Timestamp,
    lastLogin: Timestamp
}
```

### `reservations` Collection
```javascript
{
    facility: "pool",
    facilityName: "Swimming Pool",
    date: "2026-04-20",
    startTime: "14:00",
    endTime: "16:00",
    guests: 5,
    specialRequests: "Extra chairs",
    status: "pending",
    userId: "firebase-uid", // Links to user
    userEmail: "user@example.com",
    createdAt: Timestamp
}
```

All other collections follow similar pattern with `userId` to link data.

## Firebase Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all user profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Reservations
    match /reservations/{reservationId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
    }

    // Maintenance requests
    match /maintenance_requests/{requestId} {
      allow read: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || 
                    request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                     request.auth.token.admin == true);
    }
  }
}
```

## Next Steps

1. **Set up Firestore security rules** as shown above
2. **Create admin user** and set admin flag
3. **Add more auth providers**: Google, Facebook (optional)
4. **Implement email verification** for account activation
5. **Add password strength requirements**
6. **Create password reset UI** (currently just a prompt)

## Support

For setup issues, check:
- `AUTH_SETUP.md` - Detailed guide
- `FIRESTORE_SETUP.md` - Database config
- Firebase Console logs for errors
