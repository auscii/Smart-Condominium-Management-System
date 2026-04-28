# Firestore Database Integration

This project uses Firebase Firestore for real-time database operations.

## Setup Instructions

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "barangay-portal")
4. Follow the setup wizard

### 2. Enable Firestore Database

1. In the Firebase console, go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development) or **Start in production mode**
4. Select a location close to your users

### 3. Get Your Firebase Config

1. In the Firebase console, click the gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click "Add app" > Web app (</>) icon
4. Register the app with a nickname (e.g., "Web App")
5. Copy the `firebaseConfig` object

### 4. Update Configuration

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### 5. Set Up Firestore Security Rules

For production, configure Firestore security rules in the Firebase console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow read access to all public data
    match /{document=**} {
      allow read: if true;
    }

    // Secure write operations (customize for your auth system)
    match /reservations/{document} {
      allow write: if request.auth != null;
      allow create: if request.auth != null;
    }

    match /maintenance_requests/{document} {
      allow write: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Add more rules as needed
  }
}
```

## Database Collections

The app uses these Firestore collections:

- `users` - User profiles and authentication data
- `facilities` - Available facilities and amenities
- `reservations` - Facility booking records
- `announcements` - Community announcements
- `maintenance_requests` - Maintenance and repair requests
- `visitors` - Visitor registration logs
- `marketplace_listings` - Items for sale/trade
- `events` - Community events
- `units` - Condominium unit information

## API Reference

### FirestoreService Methods

```javascript
// Generic CRUD
FirestoreService.addDoc(collection, data)
FirestoreService.getDoc(collection, docId)
FirestoreService.updateDoc(collection, docId, data)
FirestoreService.deleteDoc(collection, docId)
FirestoreService.getAll(collection, orderBy, limit)
FirestoreService.query(collection, field, operator, value)

// Real-time listeners
const unsubscribe = FirestoreService.onSnapshot(collection, callback)
unsubscribe() // to stop listening

// Specific helpers
FirestoreService.addReservation(data)
FirestoreService.getReservations(userId)
FirestoreService.addAnnouncement(data)
FirestoreService.getAnnouncements(limit)
FirestoreService.addMaintenanceRequest(data)
FirestoreService.getMaintenanceRequests(userId)
FirestoreService.addVisitor(data)
FirestoreService.getVisitors()
FirestoreService.addMarketplaceListing(data)
FirestoreService.getMarketplaceListings()
FirestoreService.addEvent(data)
FirestoreService.getEvents()
```

### Document Structure Examples

**Reservation:**
```javascript
{
    facility: "pool",
    date: "2026-04-20",
    startTime: "14:00",
    endTime: "16:00",
    guests: 10,
    specialRequests: "Extra chairs needed",
    status: "pending", // pending, confirmed, cancelled
    userId: "user123",
    createdAt: Timestamp
}
```

**Maintenance Request:**
```javascript
{
    category: "Plumbing",
    priority: "High",
    subject: "Leaking faucet",
    description: "Kitchen sink is leaking",
    status: "open", // open, in-progress, resolved
    userId: "user123",
    createdAt: Timestamp
}
```

**Announcement:**
```javascript
{
    title: "Pool Maintenance",
    content: "Pool closed for cleaning",
    tag: "General", // Urgent, General, Event
    createdAt: Timestamp
}
```

**Visitor:**
```javascript
{
    name: "Maria Santos",
    purpose: "Family Visit",
    date: "2026-04-20",
    time: "14:30",
    status: "registered",
    createdAt: Timestamp
}
```

## Offline Support

Firestore persistence is enabled by default. Data will be cached locally and sync when online.

```javascript
// Check if offline
if (!navigator.onLine) {
    console.log('Working offline - changes will sync when connection restored');
}
```

## Troubleshooting

**Error: "Firestore persistence is not available"**
- Ensure you're using compatible Firebase SDK versions
- Check browser support for IndexedDB

**Permission denied errors**
- Verify Firestore security rules are configured correctly
- Check that you're authenticated if rules require auth

**Network errors**
- Ensure Firebase project is properly set up
- Verify API key and project ID are correct

## Development Mode Security

For testing/development, you can use permissive rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Remember to tighten rules before production!**
