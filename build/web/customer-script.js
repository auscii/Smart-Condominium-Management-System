// Customer Booking Page Script
document.addEventListener('DOMContentLoaded', function() {
    const facilitiesGrid = document.getElementById('facilitiesGrid');
    const reservationsList = document.getElementById('reservationsList');
    const bookingModal = document.getElementById('bookingModal');
    const closeModal = document.getElementById('closeModal');
    const bookingForm = document.getElementById('bookingForm');
    const modalFacilityName = document.getElementById('modalFacilityName');
    
    let selectedFacility = null;

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
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    };

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Load facilities from Firestore (if available) or use default
    async function loadFacilities() {
        try {
            // Try to load from Firestore first
            const result = await FirestoreService.getAll('facilities');
            
            if (result.success && result.data.length > 0) {
                facilitiesGrid.innerHTML = result.data.map(facility => `
                    <div class="facility-card" data-facility="${facility.id}">
                        <div class="facility-icon ${facility.id || 'default'}">
                            <i class="fas ${facility.icon || 'fa-building'}"></i>
                        </div>
                        <div class="facility-content">
                            <h3>${facility.name || 'Facility'}</h3>
                            <p>${facility.description || 'No description available'}</p>
                            <div class="facility-meta">
                                <span><i class="fas fa-users"></i> Max ${facility.maxGuests || 10} guests</span>
                                <span><i class="fas fa-clock"></i> ${facility.hours || '9AM - 9PM'}</span>
                            </div>
                            <button class="book-facility-btn" 
                                    data-facility="${facility.id}" 
                                    data-name="${facility.name || 'Facility'}"
                                    data-max="${facility.maxGuests || 10}">
                                Book Now
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            
            // Re-attach event listeners to newly added buttons
            attachBookingListeners();
        } catch (error) {
            console.error('Error loading facilities:', error);
            // Keep default HTML facilities
        }
    }

    // Load user's reservations
    async function loadReservations() {
        try {
            const result = await FirestoreService.getAll('reservations');
            
            if (result.success && result.data.length > 0) {
                const userReservations = result.data.filter(r => 
                    r.email && r.email === localStorage.getItem('customerEmail')
                );

                if (userReservations.length > 0) {
                    reservationsList.innerHTML = userReservations.map(reservation => `
                        <div class="reservation-item" data-id="${reservation.id}">
                            <div class="reservation-date">
                                <span class="day">${reservation.date ? new Date(reservation.date).getDate() : '--'}</span>
                                <span class="month">${reservation.date ? new Date(reservation.date).toLocaleString('default', { month: 'short' }) : '---'}</span>
                            </div>
                            <div class="reservation-details">
                                <h4>${reservation.facilityName || reservation.facility || 'Facility'}</h4>
                                <p>${reservation.startTime || ''} - ${reservation.endTime || ''}</p>
                            </div>
                            <span class="reservation-status ${reservation.status || 'pending'}">${reservation.status || 'Pending'}</span>
                            ${reservation.status !== 'cancelled' ? 
                                `<button class="cancel-btn" onclick="cancelReservation('${reservation.id}')">Cancel</button>` : 
                                ''}
                        </div>
                    `).join('');
                } else {
                    reservationsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-calendar-times"></i>
                            <p>No reservations yet. Book a facility to get started!</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
        }
    }

    // Attach event listeners to booking buttons
    function attachBookingListeners() {
        document.querySelectorAll('.book-facility-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                selectedFacility = {
                    id: this.dataset.facility,
                    name: this.dataset.name,
                    maxGuests: parseInt(this.dataset.max) || 10
                };
                
                modalFacilityName.textContent = selectedFacility.name;
                
                // Set guests max
                document.getElementById('guests').max = selectedFacility.maxGuests;
                
                bookingModal.classList.add('active');
            });
        });
    }

    // Close modal
    closeModal.addEventListener('click', function() {
        bookingModal.classList.remove('active');
    });

    bookingModal.addEventListener('click', function(e) {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('active');
        }
    });

    // Handle booking form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            facility: selectedFacility?.id || 'Unknown',
            facilityName: selectedFacility?.name || 'Unknown Facility',
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            guests: parseInt(document.getElementById('guests').value),
            specialRequests: document.getElementById('specialRequests').value,
            status: 'pending',
            createdAt: new Date()
        };

        // Save email to localStorage for future reservations
        localStorage.setItem('customerEmail', formData.email);

        FirestoreService.addDoc('reservations', formData).then(result => {
            if (result.success) {
                showToast('✅ Booking confirmed! Check your email for confirmation.', 'success');
                bookingModal.classList.remove('active');
                bookingForm.reset();
                
                // Reset guests max to default
                document.getElementById('guests').max = 100;
                
                // Reload reservations
                loadReservations();
            } else {
                showToast('❌ Error: ' + result.error, 'error');
            }
        });
    });

    // Global cancel function
    window.cancelReservation = async function(reservationId) {
        if (confirm('Are you sure you want to cancel this reservation?')) {
            const result = await FirestoreService.deleteDoc('reservations', reservationId);
            if (result.success) {
                showToast('✅ Reservation cancelled successfully', 'success');
                loadReservations();
            } else {
                showToast('❌ Error: ' + result.error, 'error');
            }
        }
    };

    // Initialize
    loadFacilities();
    loadReservations();

    // Keyboard escape to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
            bookingModal.classList.remove('active');
        }
    });
});
