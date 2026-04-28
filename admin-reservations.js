// Admin Reservations Page Script
document.addEventListener('DOMContentLoaded', function() {
    // State
    let allReservations = [];
    let filteredReservations = [];
    let currentPage = 1;
    let itemsPerPage = 20;
    let currentView = 'list'; // 'list' or 'grid'

    // DOM Elements
    const statusFilter = document.getElementById('statusFilter');
    const facilityFilter = document.getElementById('facilityFilter');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const searchInput = document.getElementById('searchInput');
    const viewBtns = document.querySelectorAll('.view-btn');
    const refreshBtn = document.getElementById('refreshBtn');
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    const reservationsList = document.getElementById('reservationsList');
    const reservationsGrid = document.getElementById('reservationsGrid');
    const gridCount = document.getElementById('gridCount');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    // Stats
    const totalReservationsEl = document.getElementById('totalReservations');
    const pendingCountEl = document.getElementById('pendingCount');
    const confirmedCountEl = document.getElementById('confirmedCount');
    const cancelledCountEl = document.getElementById('cancelledCount');

    // Modal elements
    const statusModal = document.getElementById('statusModal');
    const closeStatusModal = document.getElementById('closeStatusModal');
    const statusForm = document.getElementById('statusForm');
    const editReservationId = document.getElementById('editReservationId');
    const currentStatusInput = document.getElementById('currentStatus');
    const newStatusSelect = document.getElementById('newStatus');
    const statusNotes = document.getElementById('statusNotes');
    const cancelStatusBtn = document.getElementById('cancelStatus');

    // Toast Notification System
    window.showToast = function(message, type = 'success', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Load all reservations from Firestore (no limit)
    async function loadAllReservations() {
        try {
            showToast('⏳ Loading all reservations...', 'info', 2000);
            
            // Fetch all reservations without limit
            const result = await FirestoreService.getAll('reservations', 'createdAt');
            
            if (result.success) {
                allReservations = result.data;
                applyFilters();
                updateStats();
                showToast(`✅ Loaded ${allReservations.length} reservations`, 'success', 2000);
            } else {
                showToast('❌ Error loading: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            showToast('❌ Failed to load reservations', 'error');
        }
    }

    // Apply filters
    function applyFilters() {
        filteredReservations = allReservations.filter(res => {
            // Status filter
            if (statusFilter.value !== 'all' && res.status !== statusFilter.value) {
                return false;
            }
            
            // Facility filter
            if (facilityFilter.value !== 'all' && res.facility !== facilityFilter.value) {
                return false;
            }
            
            // Date range filter
            if (dateFrom.value || dateTo.value) {
                const resDate = res.date ? new Date(res.date) : 
                    (res.createdAt?.seconds ? new Date(res.createdAt.seconds * 1000) : new Date());
                const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
                const toDate = dateTo.value ? new Date(dateTo.value) : null;
                
                if (fromDate && resDate < fromDate) return false;
                if (toDate) {
                    toDate.setHours(23, 59, 59, 999);
                    if (resDate > toDate) return false;
                }
            }
            
            // Search filter
            if (searchInput.value.trim()) {
                const searchTerm = searchInput.value.toLowerCase();
                const userName = res.userEmail ? res.userEmail.toLowerCase() : '';
                const facilityName = (res.facilityName || res.facility || '').toLowerCase();
                const nameMatch = res.name ? res.name.toLowerCase().includes(searchTerm) : false;
                
                if (!userName.includes(searchTerm) && 
                    !facilityName.includes(searchTerm) && 
                    !nameMatch) {
                    return false;
                }
            }
            
            return true;
        });

        currentPage = 1;
        renderReservations();
    }

    // Update stats
    function updateStats() {
        totalReservationsEl.textContent = allReservations.length;
        pendingCountEl.textContent = allReservations.filter(r => r.status === 'pending').length;
        confirmedCountEl.textContent = allReservations.filter(r => r.status === 'confirmed').length;
        cancelledCountEl.textContent = allReservations.filter(r => r.status === 'cancelled').length;
    }

    // Render reservations (list or grid)
    function renderReservations() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredReservations.slice(start, end);
        const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

        // Update pagination
        updatePagination(totalPages);

        if (currentView === 'list') {
            renderListView(pageData);
        } else {
            renderGridView(pageData);
            gridCount.textContent = `${filteredReservations.length} reservations`;
        }
    }

    // Render list view
    function renderListView(data) {
        if (data.length === 0) {
            reservationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No reservations found</p>
                </div>
            `;
            return;
        }

        reservationsList.innerHTML = data.map(res => {
            const date = res.date ? new Date(res.date) : 
                (res.createdAt?.seconds ? new Date(res.createdAt.seconds * 1000) : new Date());
            
            return `
                <div class="list-row">
                    <div class="list-col col-date" data-label="Date">
                        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div class="list-col col-facility" data-label="Facility">
                        <div class="grid-facility">
                            <div class="grid-facility-icon ${res.facility || 'default'}">
                                <i class="fas ${getFacilityIcon(res.facility)}"></i>
                            </div>
                            <span>${res.facilityName || res.facility || 'Unknown'}</span>
                        </div>
                    </div>
                    <div class="list-col col-user" data-label="User">
                        <div class="user-info">
                            <span class="user-avatar">${(res.userEmail || 'E').charAt(0).toUpperCase()}</span>
                            <div>
                                <div>${res.name || 'Unknown'}</div>
                                <div class="email">${res.userEmail || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="list-col col-time" data-label="Time">
                        ${res.startTime || ''} - ${res.endTime || ''}
                    </div>
                    <div class="list-col col-guests" data-label="Guests">
                        ${res.guests || 1}
                    </div>
                    <div class="list-col col-status" data-label="Status">
                        <span class="status-badge ${res.status || 'pending'}">${res.status || 'pending'}</span>
                    </div>
                    <div class="list-col col-actions" data-label="Actions">
                        <button class="action-btn-sm btn-view" onclick="viewReservation('${res.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-sm btn-edit" onclick="openStatusModal('${res.id}', '${res.status}')" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-sm btn-cancel-res" onclick="cancelReservation('${res.id}')" title="Cancel">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render grid view
    function renderGridView(data) {
        if (data.length === 0) {
            reservationsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No reservations found</p>
                </div>
            `;
            return;
        }

        reservationsGrid.innerHTML = data.map(res => {
            const date = res.date ? new Date(res.date) : 
                (res.createdAt?.seconds ? new Date(res.createdAt.seconds * 1000) : new Date());
            
            return `
                <div class="grid-card">
                    <div class="grid-card-header">
                        <div class="grid-facility">
                            <div class="grid-facility-icon ${res.facility || 'default'}">
                                <i class="fas ${getFacilityIcon(res.facility)}"></i>
                            </div>
                            <div class="grid-facility-name">${res.facilityName || res.facility || 'Unknown'}</div>
                        </div>
                        <span class="status-badge ${res.status || 'pending'}">${res.status || 'pending'}</span>
                    </div>
                    <div class="grid-card-body">
                        <div class="grid-info-row">
                            <i class="fas fa-calendar"></i>
                            <span>${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div class="grid-info-row">
                            <i class="fas fa-clock"></i>
                            <span>${res.startTime || ''} - ${res.endTime || ''}</span>
                        </div>
                        <div class="grid-info-row">
                            <i class="fas fa-users"></i>
                            <span>${res.guests || 1} guest(s)</span>
                        </div>
                        ${res.specialRequests ? `
                        <div class="grid-info-row">
                            <i class="fas fa-sticky-note"></i>
                            <span title="${res.specialRequests}">${res.specialRequests.substring(0, 50)}${res.specialRequests.length > 50 ? '...' : ''}</span>
                        </div>
                        ` : ''}
                        <div class="grid-user-info">
                            <div class="user-avatar">${(res.userEmail || 'U').charAt(0).toUpperCase()}</div>
                            <div>
                                <div><strong>${res.name || 'Unknown User'}</strong></div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">${res.userEmail || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid-footer">
                        <div class="grid-status">
                            <button class="action-btn-sm btn-view" onclick="viewReservation('${res.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn-sm btn-edit" onclick="openStatusModal('${res.id}', '${res.status}')" title="Update">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn-sm btn-cancel-res" onclick="cancelReservation('${res.id}')" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update pagination
    function updatePagination(totalPages) {
        pageNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                renderReservations();
            };
            pageNumbers.appendChild(pageBtn);
        }
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // Get facility icon
    function getFacilityIcon(facility) {
        const icons = {
            pool: 'fa-swimming-pool',
            gym: 'fa-dumbbell',
            tennis: 'fa-basketball-ball',
            basketball: 'fa-basketball-ball',
            function: 'fa-people-roof',
            'meeting': 'fa-video'
        };
        return icons[facility] || 'fa-building';
    }

    // View reservation details
    window.viewReservation = function(id) {
        const res = allReservations.find(r => r.id === id);
        if (res) {
            const date = res.date ? new Date(res.date) : 
                (res.createdAt?.seconds ? new Date(res.createdAt.seconds * 1000) : new Date());
            
            const details = `
ID: ${res.id}
Facility: ${res.facilityName || res.facility || 'Unknown'}
Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${res.startTime || ''} - ${res.endTime || ''}
Guests: ${res.guests || 1}
User: ${res.userEmail || 'N/A'}
Name: ${res.name || 'N/A'}
Status: ${res.status || 'pending'}
Special Requests: ${res.specialRequests || 'None'}
Created: ${res.createdAt?.seconds ? new Date(res.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
            `.trim();
            
            alert(details);
        }
    };

    // Cancel reservation
    window.cancelReservation = async function(id) {
        if (confirm('Are you sure you want to cancel this reservation?')) {
            const result = await FirestoreService.updateDoc('reservations', id, {
                status: 'cancelled',
                cancelledAt: new Date()
            });
            
            if (result.success) {
                showToast('✅ Reservation cancelled', 'success');
                loadAllReservations();
            } else {
                showToast('❌ ' + result.error, 'error');
            }
        }
    };

    // Open status modal
    window.openStatusModal = function(id, currentStatus) {
        editReservationId.value = id;
        currentStatusInput.value = currentStatus;
        newStatusSelect.value = currentStatus;
        statusModal.classList.add('active');
    };

    // Close status modal
    function closeModal() {
        statusModal.classList.remove('active');
        statusForm.reset();
    }

    // Update reservation status
    statusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = editReservationId.value;
        const newStatus = newStatusSelect.value;
        const notes = statusNotes.value;
        
        const updates = {
            status: newStatus,
            updatedAt: new Date()
        };
        
        if (newStatus === 'cancelled') {
            updates.cancelledAt = new Date();
        }
        if (newStatus === 'completed') {
            updates.completedAt = new Date();
        }
        if (notes) {
            updates.statusNotes = notes;
        }

        FirestoreService.updateDoc('reservations', id, updates).then(result => {
            if (result.success) {
                showToast('✅ Status updated successfully', 'success');
                closeModal();
                loadAllReservations();
            } else {
                showToast('❌ ' + result.error, 'error');
            }
        });
    });

    // Event Listeners for filters
    let filterTimeout;
    [statusFilter, facilityFilter, dateFrom, dateTo].forEach(el => {
        el.addEventListener('change', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyFilters, 300);
        });
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(applyFilters, 500);
    });

    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            
            if (currentView === 'list') {
                listView.classList.remove('hidden');
                gridView.classList.add('hidden');
            } else {
                listView.classList.add('hidden');
                gridView.classList.remove('hidden');
            }
            renderReservations();
        });
    });

    // Refresh button
    refreshBtn.addEventListener('click', loadAllReservations);

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderReservations();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderReservations();
        }
    });

    // Modal close handlers
    closeStatusModal.addEventListener('click', closeModal);
    cancelStatusBtn.addEventListener('click', closeModal);
    statusModal.addEventListener('click', (e) => {
        if (e.target === statusModal) closeModal();
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && statusModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Initialize
    loadAllReservations();
});
