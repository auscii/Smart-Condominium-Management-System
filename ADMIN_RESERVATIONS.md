# Admin Facility Reservations

Comprehensive admin interface for managing all facility reservations with filtering, search, and multiple view options.

## Features

### 📊 Dashboard Stats
- **Total Reservations** - Count of all bookings
- **Pending** - Awaiting confirmation
- **Confirmed** - Approved bookings
- **Cancelled** - Cancelled reservations

### 🔍 Advanced Filters
- **Status** - All / Pending / Confirmed / Cancelled / Completed
- **Facility** - All / Pool / Gym / Basketball Court / Function Hall
- **Date Range** - From and To date pickers
- **Search** - By user email, name, or facility name

### 👁️ View Options
- **List View** - Traditional table layout with columns
- **Grid/Thumbnail View** - Card-based visual layout

### 🎯 Actions
- **View** - See full reservation details
- **Edit Status** - Change reservation status with notes
- **Cancel** - Cancel a reservation (with confirmation)

### 📄 Pagination
- 20 reservations per page
- Page navigation with prev/next buttons
- Page number links

## Access

**URL:** `admin-reservations.html`

Add to sidebar (already added in index.html):
```html
<a href="admin-reservations.html" class="nav-item">
    <i class="fas fa-tasks"></i>
    <span>Admin: Reservations</span>
</a>
```

## Data Display

### List View Columns
| Column | Description |
|--------|-------------|
| Date | Reservation date |
| Facility | Facility name with icon |
| User | User email and name |
| Time | Start - End time |
| Guests | Number of guests |
| Status | Color-coded badge |
| Actions | View / Edit / Cancel buttons |

### Grid View Cards
Shows facility icon, name, date/time, guest count, user info, status badge, and action buttons in a card layout.

## Filtering

Filters work together (AND logic):
1. **Status** dropdown - filter by reservation status
2. **Facility** dropdown - filter by facility type
3. **Date Range** - filter by reservation date
4. **Search** - searches across email, name, facility

All filters update automatically (with debounce for performance).

## Status Management

Click **Edit** button to open status modal:
- View current status
- Select new status (Pending/Confirmed/Cancelled/Completed)
- Add optional notes
- Save changes

Status changes are saved to Firestore and reflect immediately.

## Responsive Design

- **Desktop** - Full table view with all columns
- **Tablet** - Compressed table, smaller fonts
- **Mobile** - List view transforms to card layout with data-labels

## Data Source

All data comes from Firestore `reservations` collection:
- Ordered by `createdAt` descending
- Loads up to 100 most recent (configurable in code)

## Code Structure

```javascript
// Key functions in admin-reservations.js:

loadAllReservations()      // Fetch from Firestore
applyFilters()             // Apply all active filters
renderListView()           // Render table view
renderGridView()           // Render card grid view
updateStats()              // Update stat cards
updatePagination()         // Update page numbers
openStatusModal()          // Open edit modal
```

## Customization

### Items Per Page
```javascript
let itemsPerPage = 20; // Change in admin-reservations.js
```

### Default Sort
Currently by `createdAt` descending. Change in FirestoreService.getAll() call.

### Facility Icons
Add new facility types:
```javascript
function getFacilityIcon(facility) {
    const icons = {
        pool: 'fa-swimming-pool',
        gym: 'fa-dumbbell',
        tennis: 'fa-basketball-ball',
        function: 'fa-people-roof',
        meeting: 'fa-video',  // Add custom
        // ...
    };
    return icons[facility] || 'fa-building';
}
```

## Firestore Security Rules

For admin access, ensure your Firestore rules allow reading all reservations:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admins to read all reservations
    match /reservations/{reservationId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

Or for development mode (less secure):
```
match /reservations/{document} {
  allow read, write: if true;
}
```

## Integration

The admin page uses existing:
- `firebase-config.js` - Firebase initialization
- `firestore-service.js` - CRUD operations
- Same toast notification system

No additional setup needed beyond Firebase configuration.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE11 support

## Performance

- Debounced filtering (300-500ms delay)
- Lazy rendering of list items
- Efficient Firestore queries with limit
- Client-side pagination for fast page switching
