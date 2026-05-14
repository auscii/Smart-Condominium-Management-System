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

     // Load announcements for customer view
     async function loadAnnouncements() {
         try {
             const result = await FirestoreService.getAll('announcements', 'createdAt', 10);
             
             if (result.success && result.data.length > 0) {
                 const announcementsList = document.getElementById('announcementsList');
                 
                 if (announcementsList) {
                     announcementsList.innerHTML = result.data.map(announcement => {
                         const date = announcement.createdAt?.seconds
                             ? new Date(announcement.createdAt.seconds * 1000)
                             : new Date(announcement.createdAt || Date.now());
                         
                         const priorityClass = (announcement.priority || 'normal').toLowerCase();
                         const categoryClass = (announcement.category || 'general').toLowerCase();
                         
                         return `
                             <div class="announcement-card">
                                 <div class="announcement-header">
                                     <div class="announcement-meta">
                                         <span class="announcement-category ${categoryClass}">${announcement.category || 'General'}</span>
                                         <span class="announcement-priority priority-${priorityClass}">${announcement.priority || 'Normal'}</span>
                                     </div>
                                     <span class="announcement-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                 </div>
                                 <div class="announcement-body">
                                     <h4>${announcement.title || 'No title'}</h4>
                                     <p>${announcement.content || 'No content'}</p>
                                 </div>
                                 <div class="announcement-footer">
                                     <span class="announcement-author">
                                         <i class="fas fa-user"></i> ${announcement.createdBy ? announcement.createdBy.split('@')[0] : 'Anonymous'}
                                     </span>
                                 </div>
                             </div>
                         `;
                     }).join('');
                 }
             } else {
                 const announcementsList = document.getElementById('announcementsList');
                 if (announcementsList) {
                     announcementsList.innerHTML = `
                         <div class="empty-state">
                             <i class="fas fa-bullhorn"></i>
                             <p>No announcements available.</p>
                         </div>
                     `;
                 }
             }
         } catch (error) {
             console.error('Error loading announcements:', error);
             const announcementsList = document.getElementById('announcementsList');
             if (announcementsList) {
                 announcementsList.innerHTML = `
                     <div class="empty-state">
                         <i class="fas fa-bullhorn"></i>
                         <p>Error loading announcements.</p>
                     </div>
                 `;
             }
         }
     }

     // Load marketplace listings for customer view
     async function loadMarketplaceListings() {
         try {
             const result = await FirestoreService.getAll('marketplace');
             
             if (result.success && result.data.length > 0) {
                 const marketplaceListings = document.getElementById('marketplaceListings');
                 
                 if (marketplaceListings) {
                     marketplaceListings.innerHTML = result.data.map(listing => {
                         const date = listing.createdAt?.seconds
                             ? new Date(listing.createdAt.seconds * 1000)
                             : new Date(listing.createdAt || Date.now());
                         
                         return `
                             <div class="marketplace-item">
                                 <div class="marketplace-item-header">
                                     <h3>${listing.title || 'Untitled Item'}</h3>
                                     <span class="marketplace-category">${listing.category || 'Other'}</span>
                                 </div>
                                 <div class="marketplace-item-body">
                                     <p>${listing.description || 'No description available'}</p>
                                     <div class="marketplace-item-details">
                                         <span class="marketplace-price">₱${parseFloat(listing.price || 0).toFixed(2)}</span>
                                         <span class="marketplace-condition">${listing.condition || 'Not specified'}</span>
                                     </div>
                                 </div>
                                 <div class="marketplace-item-footer">
                                     <span class="marketplace-date">
                                         <i class="fas fa-calendar"></i> ${date.toLocaleDateString()}
                                     </span>
                                     <span class="marketplace-seller">
                                         <i class="fas fa-user"></i> ${listing.sellerName || 'Anonymous'}
                                     </span>
                                 </div>
                             </div>
                         `;
                     }).join('');
                 }
             } else {
                 const marketplaceListings = document.getElementById('marketplaceListings');
                 if (marketplaceListings) {
                     marketplaceListings.innerHTML = `
                         <div class="empty-state">
                             <i class="fas fa-store"></i>
                             <p>No items listed yet.</p>
                         </div>
                     `;
                 }
             }
         } catch (error) {
             console.error('Error loading marketplace listings:', error);
             const marketplaceListings = document.getElementById('marketplaceListings');
             if (marketplaceListings) {
                 marketplaceListings.innerHTML = `
                     <div class="empty-state">
                         <i class="fas fa-store"></i>
                         <p>Error loading marketplace.</p>
                     </div>
                 `;
             }
         }
     }

     // Handle marketplace form submission
     function handleMarketplaceForm() {
         const marketplaceForm = document.getElementById('marketplaceForm');
         if (!marketplaceForm) return;
         
         marketplaceForm.addEventListener('submit', function(e) {
             e.preventDefault();
             
             // Get form values
             const formData = {
                 title: document.getElementById('itemName').value.trim(),
                 category: document.getElementById('itemCategory').value,
                 price: document.getElementById('itemPrice').value,
                 condition: document.getElementById('itemCondition').value,
                 description: document.getElementById('itemDescription').value.trim(),
                 sellerName: localStorage.getItem('customerName') || 'Anonymous',
                 sellerEmail: localStorage.getItem('customerEmail') || '',
                 createdAt: new Date()
             };
             
             // Validate required fields
             if (!formData.title || !formData.category || !formData.price || !formData.condition || !formData.description) {
                 showToast('❌ Please fill in all required fields.', 'error');
                 return;
             }
             
             // Validate price
             if (parseFloat(formData.price) <= 0) {
                 showToast('❌ Price must be greater than zero.', 'error');
                 return;
             }
             
             // Show loading state
             const submitBtn = document.getElementById('createListingBtn');
             const originalText = submitBtn.textContent;
             submitBtn.textContent = 'Posting...';
             submitBtn.disabled = true;
             
             // Save to Firestore
             FirestoreService.addDoc('marketplace', formData)
                 .then(result => {
                     // Reset button state
                     submitBtn.textContent = originalText;
                     submitBtn.disabled = false;
                     
                     if (result.success) {
                         showToast('✅ Item posted successfully!', 'success');
                         marketplaceForm.reset();
                         loadMarketplaceListings(); // Refresh listings
                     } else {
                         showToast('❌ Error: ' + result.error, 'error');
                     }
                 })
                 .catch(error => {
                     // Reset button state
                     submitBtn.textContent = originalText;
                     submitBtn.disabled = false;
                     showToast('❌ Failed to post item: ' + error.message, 'error');
                 });
         });
     }

     // Handle search and filter functionality for marketplace
     function setupMarketplaceFilters() {
         const searchInput = document.getElementById('searchListings');
         const categoryButtons = document.querySelectorAll('.category-btn');
         
         if (!searchInput || !categoryButtons.length) return;
         
         // Search functionality
         searchInput.addEventListener('input', function() {
             const searchTerm = this.value.toLowerCase();
             const marketplaceItems = document.querySelectorAll('.marketplace-item');
             
             marketplaceItems.forEach(item => {
                 const title = item.querySelector('.marketplace-item-header h3')?.textContent.toLowerCase() || '';
                 const description = item.querySelector('.marketplace-item-body p')?.textContent.toLowerCase() || '';
                 const category = item.querySelector('.marketplace-category')?.textContent.toLowerCase() || '';
                 
                 const matchesSearch = title.includes(searchTerm) || 
                                   description.includes(searchTerm) || 
                                   category.includes(searchTerm);
                 item.style.display = matchesSearch ? '' : 'none';
             });
         });
         
         // Category filter functionality
         categoryButtons.forEach(button => {
             button.addEventListener('click', function() {
                 // Remove active class from all buttons
                 categoryButtons.forEach(btn => btn.classList.remove('active'));
                 // Add active class to clicked button
                 this.classList.add('active');
                 
                 const selectedCategory = this.dataset.category;
                 const marketplaceItems = document.querySelectorAll('.marketplace-item');
                 
                 marketplaceItems.forEach(item => {
                     const itemCategory = item.querySelector('.marketplace-category')?.textContent || '';
                     const matchesCategory = selectedCategory === 'All' || 
                                           itemCategory.toLowerCase() === selectedCategory.toLowerCase();
                     item.style.display = matchesCategory ? '' : 'none';
                 });
             });
         });
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
      loadAnnouncements();
      loadMarketplaceListings();
      setupMarketplaceFilters();
      handleMarketplaceForm();

      // Keyboard escape to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
            bookingModal.classList.remove('active');
        }
    });
});
