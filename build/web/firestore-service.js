// Firestore Database Service
// Provides helper functions for common Firestore operations

const FirestoreService = (function() {
    // Collection references
    const collections = {
        users: 'users',
        facilities: 'facilities',
        reservations: 'reservations',
        announcements: 'announcements',
        maintenance: 'maintenance_requests',
        visitors: 'visitors',
        marketplace: 'marketplace_listings',
        events: 'events',
        units: 'units'
    };

    // Generic CRUD operations
    async function addDoc(collection, data) {
        try {
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding document:', error);
            return { success: false, error: error.message };
        }
    }

    async function getDoc(collection, docId) {
        try {
            const doc = await db.collection(collection).doc(docId).get();
            return { success: true, data: doc.exists ? doc.data() : null };
        } catch (error) {
            console.error('Error getting document:', error);
            return { success: false, error: error.message };
        }
    }

    async function updateDoc(collection, docId, data) {
        try {
            await db.collection(collection).doc(docId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    }

    async function deleteDoc(collection, docId) {
        try {
            await db.collection(collection).doc(docId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    }

    async function getAll(collection, orderBy = 'createdAt', limit = null) {
        try {
            let query = db.collection(collection).orderBy(orderBy, 'desc');
            if (limit) {
                query = query.limit(limit);
            }
            const snapshot = await query.get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error getting documents:', error);
            return { success: false, error: error.message };
        }
    }

    async function query(collection, field, operator, value) {
        try {
            const snapshot = await db.collection(collection)
                .where(field, operator, value)
                .get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error querying documents:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    function onSnapshot(collection, callback, orderBy = 'createdAt') {
        return db.collection(collection)
            .orderBy(orderBy, 'desc')
            .onSnapshot((snapshot) => {
                const data = [];
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                callback(data);
            }, (error) => {
                console.error('Error listening to collection:', error);
            });
    }

    function onDoc(collection, docId, callback) {
        return db.collection(collection)
            .doc(docId)
            .onSnapshot((doc) => {
                callback(doc.exists ? { id: doc.id, ...doc.data() } : null);
            }, (error) => {
                console.error('Error listening to document:', error);
            });
    }

    function unsubscribe(listener) {
        if (listener) {
            listener();
        }
    }

    // Specific operations for this application
    async function addReservation(data) {
        return addDoc(collections.reservations, data);
    }

    async function getReservations(userId = null) {
        if (userId) {
            return query(collections.reservations, 'userId', '==', userId);
        }
        return getAll(collections.reservations);
    }

    async function addAnnouncement(data) {
        return addDoc(collections.announcements, data);
    }

    async function getAnnouncements(limit = 10) {
        return getAll(collections.announcements, 'createdAt', limit);
    }

    async function addMaintenanceRequest(data) {
        return addDoc(collections.maintenance, data);
    }

    async function getMaintenanceRequests(userId = null) {
        if (userId) {
            return query(collections.maintenance, 'userId', '==', userId);
        }
        return getAll(collections.maintenance);
    }

    async function addVisitor(data) {
        return addDoc(collections.visitors, data);
    }

    async function getVisitors() {
        return getAll(collections.visitors);
    }

    async function addMarketplaceListing(data) {
        return addDoc(collections.marketplace, data);
    }

    async function getMarketplaceListings() {
        return getAll(collections.marketplace);
    }

    async function addEvent(data) {
        return addDoc(collections.events, data);
    }

    async function getEvents() {
        return getAll(collections.events);
    }

    // Public API
    return {
        collections,
        addDoc,
        getDoc,
        updateDoc,
        deleteDoc,
        getAll,
        query,
        onSnapshot,
        onDoc,
        unsubscribe,
        addReservation,
        getReservations,
        addAnnouncement,
        getAnnouncements,
        addMaintenanceRequest,
        getMaintenanceRequests,
        addVisitor,
        getVisitors,
        addMarketplaceListing,
        getMarketplaceListings,
        addEvent,
        getEvents
    };
})();

// Make available globally
window.FirestoreService = FirestoreService;
