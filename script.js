var isAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    // Toast Notification System (defined first for use everywhere)
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

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const appContainer = document.getElementById('appContainer');
    const emailInput = loginForm.querySelector('input[type="email"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const logoutBtn = document.getElementById('logoutBtn');

    // User profile elements
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');

    // Other DOM elements
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const actionBtns = document.querySelectorAll('.action-btn');
    // const towerBtns = document.querySelectorAll('.tower-btn');
    const floorSlider = document.getElementById('floorSlider');
    const floorDisplay = document.querySelector('.floor-display');
    const unitCards = document.querySelectorAll('.unit-card');
    const bookBtns = document.querySelectorAll('.book-btn');
    const bookingModal = document.getElementById('bookingModal');
    const closeModal = document.querySelector('.close-modal');
    const bookingForm = document.getElementById('bookingForm');
    const maintenanceForm = document.getElementById('maintenanceForm');
    const visitorForm = document.getElementById('visitorForm');
    const settingsForms = document.querySelectorAll('.settings-form');
    const emergencyTypeBtns = document.querySelectorAll('.emergency-type-btn');
    const callBtns = document.querySelectorAll('.emergency-call-btn');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const procedureTabs = document.querySelectorAll('.procedure-tab');
    const procedures = document.querySelectorAll('.procedure');

        // ==================== ANNOUNCEMENTS MANAGEMENT ====================
        const announcementForm = document.getElementById('announcementForm');
        const announcementsContainer = document.getElementById('announcementsContainer');

        // Get unread announcement count from localStorage
        function getUnreadAnnouncementCount() {
            return parseInt(localStorage.getItem('unreadAnnouncements') || '0');
        }

        // Set unread announcement count
        function setUnreadAnnouncementCount(count) {
            localStorage.setItem('unreadAnnouncements', count.toString());
            updateAnnouncementBadge(count);
        }

        // Update badge display (page badge and global badge)
        function updateAnnouncementBadge(count) {
            // Page-specific badge
            const announcementBadge = document.getElementById('announcementBadge');
            const announcementNotificationBtn = document.getElementById('announcementNotificationBtn');
            if (announcementBadge) {
                if (count > 0) {
                    announcementBadge.textContent = count > 99 ? '99+' : count;
                    announcementBadge.style.display = 'inline-flex';
                    if (announcementNotificationBtn) announcementNotificationBtn.classList.add('has-notifications');
                } else {
                    announcementBadge.style.display = 'none';
                    if (announcementNotificationBtn) announcementNotificationBtn.classList.remove('has-notifications');
                }
            }
            // Global badge in top bar
            const globalBadge = document.getElementById('globalNotificationBadge');
            const globalBtn = document.getElementById('globalNotificationBtn');
            if (globalBadge) {
                if (count > 0) {
                    globalBadge.textContent = count > 99 ? '99+' : count;
                    globalBadge.style.display = 'inline-flex';
                    if (globalBtn) globalBtn.classList.add('has-notifications');
                } else {
                    globalBadge.style.display = 'none';
                    if (globalBtn) globalBtn.classList.remove('has-notifications');
                }
            }
        }

        // Announcement form submission
        if (announcementForm) {
            announcementForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast('❌ Please log in to post an announcement.', 'error');
                    return;
                }

                const formData = {
                    title: this.querySelector('#announcementTitle').value,
                    category: this.querySelector('#announcementCategory').value,
                    priority: this.querySelector('#announcementPriority').value,
                    content: this.querySelector('#announcementContent').value,
                    createdBy: user.email,
                    createdByUserId: user.uid,
                    createdAt: new Date()
                };

                // Validate required fields
                if (!formData.title || !formData.category || !formData.priority || !formData.content) {
                    showToast('❌ Please fill in all required fields.', 'error');
                    return;
                }

                // Show loader
                const submitBtn = document.getElementById('createAnnouncementBtn');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                if (btnText) btnText.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'inline-flex';
                submitBtn.disabled = true;

                FirestoreService.addDoc('announcements', formData).then(result => {
                    // Hide loader
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;

                    if (result.success) {
                        showToast('✅ Announcement posted successfully!', 'success');
                        announcementForm.reset();
                        loadAnnouncements(); // Refresh announcements list
                        // Increment unread notification count
                        const currentCount = getUnreadAnnouncementCount();
                        setUnreadAnnouncementCount(currentCount + 1);
                    } else {
                        showToast('❌ Error: ' + result.error, 'error');
                    }
                }).catch(error => {
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast('❌ Failed to post announcement: ' + error.message, 'error');
                });
            });
        }

        // Load all announcements from Firestore
        async function loadAnnouncements() {
            if (!announcementsContainer) return;

            try {
                const result = await FirestoreService.getAll('announcements', 'createdAt', 20);

                if (result.success && result.data.length > 0) {
                    announcementsContainer.innerHTML = result.data.map(announcement => {
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
                } else {
                    announcementsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-bullhorn"></i>
                            <p>No announcements yet</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading announcements:', error);
            }
        }

        // Load announcements if on announcements page, and clear unread count when viewing
        if (document.getElementById('announcementsContainer')) {
            loadAnnouncements();
            setUnreadAnnouncementCount(0);
        }

        // ==================== END ANNOUNCEMENTS MANAGEMENT ====================

        // ==================== GLOBAL NOTIFICATIONS ====================
        const globalNotificationBtn = document.getElementById('globalNotificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const notificationList = document.getElementById('notificationList');

        // Initialize badge on load
        if (globalNotificationBtn) {
            updateAnnouncementBadge(getUnreadAnnouncementCount());
        }

        // Toggle dropdown
        if (globalNotificationBtn && notificationDropdown) {
            globalNotificationBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const isHidden = notificationDropdown.style.display === 'none' || !notificationDropdown.style.display;
                notificationDropdown.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    loadNotificationsDropdown();
                    setUnreadAnnouncementCount(0);
                }
            });

            document.addEventListener('click', function(e) {
                if (!notificationDropdown.contains(e.target) && e.target !== globalNotificationBtn) {
                    notificationDropdown.style.display = 'none';
                }
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    notificationDropdown.style.display = 'none';
                }
            });
        }

        // Escape HTML helper
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Load recent announcements into dropdown
        async function loadNotificationsDropdown() {
            if (!notificationList) return;
            try {
                const result = await FirestoreService.getAll('announcements', 'createdAt', 10);
                if (result.success && result.data.length > 0) {
                    notificationList.innerHTML = result.data.map(ann => {
                        const date = ann.createdAt?.seconds
                            ? new Date(ann.createdAt.seconds * 1000)
                            : new Date(ann.createdAt || Date.now());
                        return `
                            <div class="notification-item">
                                <div class="notification-content">
                                    <h5>${escapeHtml(ann.title || 'Announcement')}</h5>
                                    <p>${escapeHtml((ann.content || '').substring(0, 100))}${(ann.content || '').length > 100 ? '...' : ''}</p>
                                    <small>${date.toLocaleDateString()}</small>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    notificationList.innerHTML = '<div class="notification-empty">No announcements yet</div>';
                }
            } catch (error) {
                console.error('Error loading notifications dropdown:', error);
                notificationList.innerHTML = '<div class="notification-empty">Error loading</div>';
            }
        }

        // ==================== END GLOBAL NOTIFICATIONS ====================
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Firebase Auth state observer
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loginOverlay.classList.add('hidden');
            appContainer.classList.add('active');
            loadUserData(user);
        } else {
            loginOverlay.classList.remove('hidden');
            appContainer.classList.remove('active');
            if (userNameEl) userNameEl.textContent = 'Guest';
            if (userRoleEl) userRoleEl.textContent = 'Not logged in';
            if (userAvatarEl) userAvatarEl.textContent = 'G';
        }
    });

    // Login form handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showToast('❌ Please enter both email and password.', 'error');
            return;
        }

        const submitBtn = document.getElementById('loginBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        // Session-only auth (no persistence)
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
            .then(() => firebase.auth().signInWithEmailAndPassword(email, password))
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('user.email: ', user.email);
                if (user.email.toLowerCase().includes("admin")) {
                    isAdmin = true;
                } else {
                    isAdmin = false;
                }
                console.log('isAdmin: ', isAdmin);
                sessionStorage.setItem('userEmail', user.email);
                sessionStorage.setItem('userName', user.displayName || email.split('@')[0]);
                showToast('Login successful! Welcome back.', 'success');
            })
            .catch((error) => {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. ';
                switch(error.code) {
                    case 'auth/invalid-email': errorMessage += 'Invalid email address.'; break;
                    case 'auth/user-disabled': errorMessage += 'This account has been disabled.'; break;
                    case 'auth/user-not-found': errorMessage += 'No account found with this email.'; break;
                    case 'auth/wrong-password': errorMessage += 'Incorrect password.'; break;
                    case 'auth/invalid-credential': errorMessage += 'Invalid email or password.'; break;
                    case 'auth/too-many-requests': errorMessage += 'Too many attempts. Please try again later.'; break;
                    default: errorMessage += error.message;
                }
                showToast('❌ ' + errorMessage, 'error');
            })
            .finally(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    });

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                if (userNameEl) userNameEl.textContent = 'Guest';
                if (userRoleEl) userRoleEl.textContent = 'Not logged in';
                if (userAvatarEl) userAvatarEl.textContent = 'G';
                showToast('Logged out successfully', 'success');
            }).catch((error) => {
                showToast('❌ Error signing out: ' + error.message, 'error');
            });
        });
    }

    // Load user data after login
    async function loadUserData(user) {
        const displayName = user.displayName || sessionStorage.getItem('userName') || user.email.split('@')[0];
        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        
        if (userNameEl) userNameEl.textContent = displayName;
        if (userRoleEl) userRoleEl.textContent = 'Resident';
        if (userAvatarEl) userAvatarEl.textContent = initials;

        try {
            const result = await FirestoreService.query('users', 'email', '==', user.email);
            if (result.success && result.data.length > 0) {
                const userData = result.data[0];
                if (userNameEl && userData.unitNumber) {
                    userNameEl.textContent = `Unit ${userData.unitNumber}`;
                    userAvatarEl.textContent = userData.unitNumber.substring(0,2).toUpperCase();
                }
                if (userRoleEl && userData.role) {
                    userRoleEl.textContent = userData.role;
                }
                sessionStorage.setItem('userId', userData.id);
            }
        } catch (error) {
            console.log('User profile not found in Firestore');
        }

        loadReservations();
        loadDashboardVisitors();
    }

    // Load all reservations from Firestore
    async function loadReservations() {
        try {
            const result = await FirestoreService.getAll('reservations', 'createdAt');
            const reservationsList = document.querySelector('.reservations-list');
            const currentUser = firebase.auth().currentUser;

            if (result.success && result.data.length > 0) {
                if (reservationsList) {
                    reservationsList.innerHTML = result.data.map(res => {
                        const date = res.date ? new Date(res.date) : new Date(res.createdAt?.seconds * 1000 || Date.now());
                        const isOwner = currentUser && res.userId === currentUser.uid;
                        return `
                            <div class="reservation-item">
                                <div class="reservation-date">
                                    <span class="day">${date.getDate()}</span>
                                    <span class="month">${date.toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div class="reservation-details">
                                    <h4>${res.facilityName || res.facility || 'Facility'}</h4>
                                    <p>${res.startTime || ''} - ${res.endTime || ''}</p>
                                </div>
                                <span class="reservation-status ${res.status || 'pending'}">${res.status || 'Pending'}</span>
                                ${isOwner && res.status !== 'cancelled' ? 
                                    `<button class="cancel-btn" onclick="cancelReservation('${res.id}')">Cancel</button>` : 
                                    ''}
                            </div>
                        `;
                    }).join('');
                }
            } else if (reservationsList) {
                reservationsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>No reservations yet. Book a facility to get started!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
        }
    }

    // Cancel reservation
    window.cancelReservation = async function(reservationId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('❌ Please log in to cancel reservations.', 'error');
            return;
        }

        // Verify ownership before cancelling
        const result = await FirestoreService.getDoc('reservations', reservationId);
        if (!result.success || !result.data) {
            showToast('❌ Reservation not found', 'error');
            return;
        }

        const reservation = result.data;
        if (reservation.userId !== user.uid) {
            showToast('❌ You can only cancel your own reservations', 'error');
            return;
        }

        if (confirm('Are you sure you want to cancel this reservation?')) {
            const updateResult = await FirestoreService.updateDoc('reservations', reservationId, {
                status: 'cancelled',
                cancelledAt: new Date()
            });
            
            if (updateResult.success) {
                showToast('Reservation cancelled', 'success');
                loadReservations();
            } else {
                showToast('❌ ' + updateResult.error, 'error');
            }
        }
    };

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(pageId + '-page').classList.remove('hidden');
            if (window.innerWidth < 768) sidebar.classList.remove('active');

            // Load page-specific data
            if (pageId === 'visitors') {
                loadRecentVisitors();
            }
            if (pageId === 'maintenance') {
                loadMaintenanceRequests();
            }
            if (pageId === 'announcements') {
                loadAnnouncements();
            }
            if (pageId === 'users') {
                initUserManagement();
            }
        });
    });

    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(pageId + '-page').classList.remove('hidden');
            if (window.innerWidth < 768) sidebar.classList.remove('active');

            // Load page-specific data
            if (pageId === 'visitors') {
                loadRecentVisitors();
            }
                if (pageId === 'maintenance') {
                    loadMaintenanceRequests();
                }
                if (pageId === 'announcements') {
                    loadAnnouncements();
                }
                if (pageId === 'marketplace') {
                    loadMarketplaceListings();
                }
                if (pageId === 'records') {
                    loadRecords();
                }
            });
        });

    // View All links (dashboard cards)
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
            if (navItem) {
                navItem.click();
            }
        });
    });

    // towerBtns.forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         towerBtns.forEach(b => b.classList.remove('active'));
    //         this.classList.add('active');
    //     });
    // });

    if (floorSlider) {
        floorSlider.addEventListener('input', function() {
            floorDisplay.textContent = 'Floor ' + this.value;
        });
    }

    unitCards.forEach(card => {
        card.addEventListener('click', function() {
            unitCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });

    bookBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            bookingModal.classList.add('active');
            bookBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            bookingModal.classList.remove('active');
        });
    }

    bookingModal.addEventListener('click', function(e) {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('active');
        }
    });

    // Booking form
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('❌ Please log in to make a booking.', 'error');
                return;
            }

            const selectedBtn = document.querySelector('.book-btn.active');
            const formData = {
                facility: selectedBtn?.dataset.facility || 'Unknown',
                facilityName: selectedBtn?.dataset.facilityName || selectedBtn?.dataset.facility || 'Unknown Facility',
                date: this.querySelector('input[type="date"]').value,
                startTime: this.querySelectorAll('input[type="time"]')[0]?.value || '',
                endTime: this.querySelectorAll('input[type="time"]')[1]?.value || '',
                guests: parseInt(this.querySelector('input[type="number"]').value) || 1,
                specialRequests: this.querySelector('textarea').value || '',
                status: 'pending',
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date()
            };

            // Validation
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (selectedDate < today) {
                showToast('❌ Cannot book on a past date.', 'error');
                return;
            }
            if (formData.startTime >= formData.endTime) {
                showToast('❌ End time must be after start time.', 'error');
                return;
            }

            FirestoreService.addDoc('reservations', formData).then(result => {
                if (result.success) {
                    showToast('Booking confirmed!', 'success');
                    bookingModal.classList.remove('active');
                    bookingForm.reset();
                    loadReservations();
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Maintenance form - Store in Firestore
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            document.getElementById('btn-loader').style.display = 'block';
            // document.querySelector('#btn-loader').style.display = 'block';

            const user = firebase.auth().currentUser;

            if (!user) {
                showToast('❌ Please log in to submit a request.', 'error');
                return;
            }

            const formData = {
                category: this.querySelector('#maintenanceCategory').value,
                priority: this.querySelector('#maintenancePriority').value,
                subject: this.querySelector('#maintenanceSubject').value,
                description: this.querySelector('#maintenanceDescription').value,
                status: 'open',
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date()
            };

            // Validate required fields
            if (!formData.category || !formData.priority || !formData.subject || !formData.description) {
                showToast('❌ Please fill in all required fields.', 'error');
                document.getElementById('btn-loader').style.display = 'none';
                return;
            }

            FirestoreService.addDoc('maintenance_requests', formData).then(result => {
                document.getElementById('btn-loader').style.display = 'none';

                if (result.success) {
                    showToast('Maintenance request submitted successfully!', 'success');
                    maintenanceForm.reset();
                    loadMaintenanceRequests(); // Refresh the requests list
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Load all maintenance requests from Firestore
    async function loadMaintenanceRequests() {
        try {
            const result = await FirestoreService.getAll('maintenance_requests', 'createdAt');
            const container = document.getElementById('maintenanceRequestsList');
            
            if (!container) return;

            if (result.success && result.data.length > 0) {
                container.innerHTML = result.data.map(req => {
                    const date = req.createdAt?.seconds 
                        ? new Date(req.createdAt.seconds * 1000)
                        : new Date(req.createdAt || Date.now());
                    
                    const priorityClass = (req.priority || 'medium').toLowerCase();
                    const statusClass = (req.status || 'open').toLowerCase().replace(' ', '-');
                    const priorityIcon = {
                        'low': 'fa-arrow-down',
                        'medium': 'fa-minus',
                        'high': 'fa-arrow-up',
                        'emergency': 'fa-exclamation-triangle'
                    }[priorityClass] || 'fa-circle';
                    
                    const currentUser = firebase.auth().currentUser;
                    const isOwner = currentUser && req.userId === currentUser.uid;
                    
                    return `
                        <div class="request-item" data-priority="${priorityClass}">
                            <div class="request-header">
                                <span class="request-id">#${req.id.substring(0, 8).toUpperCase()}</span>
                                <span class="request-priority priority-${priorityClass}">
                                    <i class="fas ${priorityIcon}"></i> ${req.priority || 'Medium'}
                                </span>
                            </div>
                            <div class="request-body">
                                <h4>${req.subject || 'No subject'}</h4>
                                <p>${req.description || 'No description'}</p>
                                <div class="request-meta">
                                    <span class="request-category">
                                        <i class="fas fa-tag"></i> ${req.category || 'General'}
                                    </span>
                                    <span class="request-date">
                                        <i class="fas fa-calendar"></i> ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span class="request-user">
                                        <i class="fas fa-user"></i> ${req.userEmail ? req.userEmail.split('@')[0] : 'Anonymous'}
                                    </span>
                                </div>
                            </div>
                            <div class="request-footer">
                                <span class="request-status status-${statusClass}">${req.status || 'Open'}</span>
                                ${isOwner && req.status !== 'cancelled' && req.status !== 'completed' ? 
                                    `<button class="cancel-btn" onclick="cancelMaintenanceRequest('${req.id}')">Cancel Request</button>` : 
                                    ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-wrench"></i>
                        <p>No maintenance requests yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading maintenance requests:', error);
        }
    }

    // Cancel maintenance request
    window.cancelMaintenanceRequest = async function(requestId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('❌ Please log in to cancel requests.', 'error');
            return;
        }

        // Verify ownership
        const result = await FirestoreService.getDoc('maintenance_requests', requestId);
        if (!result.success || !result.data) {
            showToast('❌ Request not found', 'error');
            return;
        }

        const request = result.data;
        if (request.userId !== user.uid) {
            showToast('❌ You can only cancel your own requests', 'error');
            return;
        }

        if (confirm('Are you sure you want to cancel this maintenance request?')) {
            const updateResult = await FirestoreService.updateDoc('maintenance_requests', requestId, {
                status: 'cancelled',
                cancelledAt: new Date()
            });
            
            if (updateResult.success) {
                showToast('Request cancelled', 'success');
                loadMaintenanceRequests();
            } else {
                showToast('❌ ' + updateResult.error, 'error');
            }
        }
    };


    // Visitor form - Store in Firestore
    if (visitorForm) {
        visitorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('❌ Please log in to register a visitor.', 'error');
                return;
            }

            const formData = {
                name: this.querySelector('#visitorName').value,
                purpose: this.querySelector('#visitorPurpose').value,
                date: this.querySelector('#visitorDate').value,
                time: this.querySelector('#visitorTime').value,
                phone: this.querySelector('#visitorPhone')?.value || '',
                notes: this.querySelector('#visitorNotes')?.value || '',
                registeredBy: user.email,
                registeredByUserId: user.uid,
                status: 'registered',
                createdAt: new Date()
            };

            // Validate required fields
            if (!formData.name || !formData.purpose || !formData.date || !formData.time) {
                showToast('❌ Please fill in all required fields.', 'error');
                return;
            }

            FirestoreService.addDoc('visitors', formData).then(result => {
                if (result.success) {
                    showToast('Visitor registered successfully!', 'success');
                    visitorForm.reset();
                    loadRecentVisitors(); // Refresh the visitor list (visitors page)
                    loadDashboardVisitors(); // Refresh dashboard widget
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Load recent visitors from Firestore
    async function loadRecentVisitors() {
        try {
            const result = await FirestoreService.getAll('visitors', 'createdAt', 5);
            const visitorsList = document.getElementById('visitorsList');
            
            if (result.success && result.data.length > 0) {
                if (visitorsList) {
                    visitorsList.innerHTML = result.data.map(visitor => {
                        const date = visitor.createdAt?.seconds 
                            ? new Date(visitor.createdAt.seconds * 1000)
                            : new Date(visitor.createdAt || Date.now());
                        
                        const timeStr = visitor.time || '';
                        const dateStr = visitor.date || date.toISOString().split('T')[0];
                        
                        return `
                            <div class="visitor-item">
                                <div class="visitor-info">
                                    <span class="visitor-icon"><i class="fas fa-user-circle"></i></span>
                                    <span class="visitor-name">${visitor.name || 'Unknown'}</span>
                                    <span class="visitor-purpose">
                                        <i class="fas fa-tag"></i> ${visitor.purpose || 'N/A'}
                                    </span>
                                </div>
                                <span class="visitor-time">${dateStr} ${timeStr ? 'at ' + timeStr : ''}</span>
                            </div>
                        `;
                    }).join('');
                }
            } else if (visitorsList) {
                visitorsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No recent visitors</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading visitors:', error);
        }
    }

    // Load recent visitors for dashboard widget
    async function loadDashboardVisitors() {
        try {
            const result = await FirestoreService.getAll('visitors', 'createdAt', 5);
            const container = document.getElementById('dashboardVisitorsList');
            if (!container) return;

            if (result.success && result.data.length > 0) {
                container.innerHTML = result.data.map(visitor => {
                    const date = visitor.createdAt?.seconds 
                        ? new Date(visitor.createdAt.seconds * 1000)
                        : new Date(visitor.createdAt || Date.now());
                    
                    const timeStr = visitor.time || '';
                    const dateStr = visitor.date || date.toISOString().split('T')[0];
                    
                    return `
                        <div class="visitor-item">
                            <div class="visitor-info">
                                <span class="visitor-icon"><i class="fas fa-user-circle"></i></span>
                                <span class="visitor-name">${visitor.name || 'Unknown'}</span>
                                <span class="visitor-purpose">
                                    <i class="fas fa-tag"></i> ${visitor.purpose || 'N/A'}
                                </span>
                            </div>
                            <span class="visitor-time">${dateStr} ${timeStr ? 'at ' + timeStr : ''}</span>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No recent visitors</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading dashboard visitors:', error);
        }
    }

    // Settings forms
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Settings saved!', 'success');
        });
    });

    // 3D viewer controls
    const rotateBtns = document.querySelectorAll('.rotate-btn');
    rotateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const buildingModel = document.querySelector('.building-model');
            if (buildingModel) {
                buildingModel.style.transform = 'rotateY(' + (Math.random() * 360) + 'deg)';
            }
        });
    });

    const zoomBtns = document.querySelectorAll('.zoom-btn');
    zoomBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const viewer3d = document.querySelector('.viewer-3d');
            if (viewer3d) {
                const currentScale = viewer3d.style.transform.match(/scale\(([^)]+)\)/);
                let scale = currentScale ? parseFloat(currentScale[1]) : 1;
                scale = this.querySelector('.fa-plus') ? Math.min(scale + 0.1, 1.5) : Math.max(scale - 0.1, 0.5);
                viewer3d.style.transform = 'scale(' + scale + ')';
            }
        });
    });

    // Window and keyboard events
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) sidebar.classList.remove('active');
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
            bookingModal.classList.remove('active');
        }
    });

    // Category filter buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Emergency procedure tabs
    procedureTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            procedureTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const procedureId = this.getAttribute('data-procedure');
            procedures.forEach(p => p.classList.add('hidden'));
            document.getElementById(procedureId + '-procedure').classList.remove('hidden');
        });
    });

    // Emergency buttons
    emergencyTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const issue = this.querySelector('span').textContent;
            showToast('🚨 Reporting: ' + issue + '. Team notified.', 'warning');
        });
    });

    callBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showToast('📞 Dialing emergency contact...', 'info');
        });
    });

    // Initialize on page load
    function init() {
        const user = firebase.auth().currentUser;

        if (user) {
            loadUserData(user);
        } else {
            loadRecentVisitors(); // Show visitors for guests
            loadMaintenanceRequests(); // Show maintenance requests for guests
        }

        // Always load maintenance (it's public)
        if (document.getElementById('maintenanceRequestsList')) {
            loadMaintenanceRequests();
        }

        // Load events if on events page
        if (document.getElementById('eventsContainer')) {
            loadEvents();
        }

        // Events Management
        const eventForm = document.getElementById('eventForm');
        const eventsContainer = document.getElementById('eventsContainer');
        const calendarGrid = document.getElementById('calendarGrid');

        // Event form submission
        if (eventForm) {
            eventForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast('❌ Please log in to create an event.', 'error');
                    return;
                }

                const formData = {
                    title: this.querySelector('#eventTitle').value,
                    category: this.querySelector('#eventCategory').value,
                    date: this.querySelector('#eventDate').value,
                    time: this.querySelector('#eventTime').value,
                    location: this.querySelector('#eventLocation').value,
                    description: this.querySelector('#eventDescription').value,
                    maxParticipants: parseInt(this.querySelector('#eventMaxParticipants').value) || null,
                    status: this.querySelector('#eventStatus').value,
                    createdBy: user.email,
                    createdByUserId: user.uid,
                    createdAt: new Date()
                };

                // Validate required fields
                if (!formData.title || !formData.category || !formData.date || !formData.time || 
                    !formData.location || !formData.description || !formData.status) {
                    showToast('❌ Please fill in all required fields.', 'error');
                    return;
                }

                // Validate date is not in past
                const eventDate = new Date(formData.date);
                const today = new Date();
                today.setHours(0,0,0,0);
                if (eventDate < today) {
                    showToast('❌ Cannot create event on a past date.', 'error');
                    return;
                }

                // Show loader
                const submitBtn = document.getElementById('createEventBtn');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                if (btnText) btnText.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'inline-flex';
                submitBtn.disabled = true;

                FirestoreService.addDoc('events', formData).then(result => {
                    // Hide loader
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;

                    if (result.success) {
                        showToast('✅ Event created successfully!', 'success');
                        eventForm.reset();
                        loadEvents(); // Refresh events list
                        generateCalendar(); // Update calendar
                    } else {
                        showToast('❌ Error: ' + result.error, 'error');
                    }
                }).catch(error => {
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast('❌ Failed to create event: ' + error.message, 'error');
                });
            });
        }

        // Load all events from Firestore
        async function loadEvents() {
            try {
                const result = await FirestoreService.getAll('events', 'date', 0); // Get upcoming events
                
                if (result.success && result.data.length > 0) {
                    // Filter upcoming events only (date >= today)
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const upcomingEvents = result.data.filter(event => {
                        const eventDate = event.date ? new Date(event.date) : new Date(event.createdAt?.seconds * 1000);
                        // return eventDate >= today;
                        return eventDate;
                    }).sort((a,b) => new Date(a.date) - new Date(b.date));

                    renderEvents(upcomingEvents);
                    updateCalendar(upcomingEvents);
                } else {
                    if (eventsContainer) {
                        eventsContainer.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-calendar-times"></i>
                                <p>No upcoming events scheduled</p>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('Error loading events:', error);
            }
        }

        // Render events list
        function renderEvents(events) {
            if (!eventsContainer) return;

            if (events.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>No upcoming events scheduled</p>
                    </div>
                `;
                return;
            }

            eventsContainer.innerHTML = events.map(event => {
                const eventDate = event.date ? new Date(event.date) : 
                    (event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000) : new Date());
                
                const day = eventDate.getDate();
                const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                const statusClass = getEventStatusClass(event.status);
                const statusText = formatEventStatus(event.status);

                return `
                    <div class="event-card">
                        <div class="event-date-badge">
                            <span class="event-day-num">${day}</span>
                            <span class="event-month">${month}</span>
                        </div>
                        <div class="event-details">
                            <h4>${event.title || 'Untitled Event'}</h4>
                            <p><i class="fas fa-clock"></i> ${event.time || 'TBD'}</p>
                            <p><i class="fas fa-map-marker"></i> ${event.location || 'TBD'}</p>
                            <span class="event-status ${statusClass}">${statusText}</span>
                        </div>
                        <button class="event-register-btn" onclick="registerForEvent('${event.id}')">Register</button>
                    </div>
                `;
            }).join('');
        }

        // Generate calendar grid with tooltips
        function generateCalendar(events = []) {
            if (!calendarGrid) return;
            
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); // 0-indexed
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            var eventInfo = '';
            
            // Build a map of day -> events for that day
            const eventsByDay = {};
            events.forEach(event => {
                const eventDate = event.date ? new Date(event.date) : 
                    (event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000) : new Date());
                if (eventDate.getMonth() === month) {
                    const day = eventDate.getDate();
                    if (!eventsByDay[day]) {
                        eventsByDay[day] = [];
                    }
                    eventsByDay[day].push(event);
                }
            });
            
            let html = '';
            
            // Day headers
            const days = ['S','M','T','W','T','F','S'];
            days.forEach(day => {
                html += `<div class="calendar-day">${day}</div>`;
            });
            
            // Empty cells for days before first of month
            for (let i = 0; i < firstDay; i++) {
                html += `<div class="calendar-date empty"></div>`;
            }
            
            // Days
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);
                const isToday = day === today.getDate() && month === today.getMonth();
                const isPast = currentDate < today && !isToday;
                const dayEvents = eventsByDay[day] || [];
                const hasEvent = dayEvents.length > 0;
                
                let classes = 'calendar-date';
                // if (isToday) classes += ' today';
                // if (isPast) classes += ' past';
                if (hasEvent) classes += ' event-day';
                
                // Build tooltip content
                let tooltip = '';
                if (hasEvent) {
                    const eventSummaries = dayEvents.map(e => {
                        const time = e.time || 'TBD';
                        const title = e.title || 'Untitled';
                        const location = e.location || 'TBD';
                        return `${time} - ${title}\n📍 ${location}`;
                    }).join('\n');
                    eventInfo = eventSummaries;
                    tooltip = eventInfo; //eventSummaries;
                }
                
                const tooltipAttr = tooltip ? `data-tooltip="${tooltip.replace(/"/g, '&quot;')}"` : '';
                html += `<div class="${classes}" ${tooltipAttr}>${day}</div>`;
            }
            
            calendarGrid.innerHTML = html;
            
            // Add click handlers to dates
            const dateElements = calendarGrid.querySelectorAll('.calendar-date:not(.empty)');
            dateElements.forEach(el => {
                el.addEventListener('click', function() {
                    const day = parseInt(this.textContent);
                    const monthName = now.toLocaleString('default', { month: 'long' });
                    const selectedDate = new Date(year, month, day);
                    filterEventsByDate(selectedDate, eventInfo);
                });
            });
        }

        // Filter events by selected date
        function filterEventsByDate(date, eventInfo) {
            const result = FirestoreService.getAll('events', 'date', 50);
            // This will be handled by loadEvents with date filter
            // For now, just show a toast
            showToast(`Selected ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} ${eventInfo}`, 'info');
        }

        // Update calendar with event markers (legacy function kept for compatibility)
        function updateCalendar(events) {
            generateCalendar(events);
        }

        // Get event status CSS class
        function getEventStatusClass(status) {
            const classes = {
                'upcoming': 'upcoming',
                'registration-open': 'open',
                'limited': 'limited',
                'cancelled': 'cancelled',
                'completed': 'completed',
                'mandatory': 'mandatory'
            };
            return classes[status] || 'upcoming';
        }

        // Format event status for display
        function formatEventStatus(status) {
            const labels = {
                'upcoming': 'Upcoming',
                'registration-open': 'Registration Open',
                'limited': 'Limited Slots',
                'cancelled': 'Cancelled',
                'completed': 'Completed',
                'mandatory': 'Mandatory'
            };
            return labels[status] || status;
        }

        // Register for event
        window.registerForEvent = async function(eventId) {
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('❌ Please log in to register.', 'error');
                return;
            }

            // Create registration record (could be separate collection)
            const registration = {
                eventId: eventId,
                userId: user.uid,
                userEmail: user.email,
                registeredAt: new Date()
            };

            // For now just show confirmation
            // In production, you'd store in 'event_registrations' collection
            showToast('✅ Registration successful! Check your email for details.', 'success');
        };

        // Initialize calendar on page load
        if (calendarGrid) {
            generateCalendar();
        }

        // Load events if on events page
        if (document.getElementById('eventsContainer')) {
            loadEvents();
        }

        // Announcement form submission
        if (announcementForm) {
            announcementForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast('❌ Please log in to post an announcement.', 'error');
                    return;
                }

                const formData = {
                    title: this.querySelector('#announcementTitle').value,
                    category: this.querySelector('#announcementCategory').value,
                    priority: this.querySelector('#announcementPriority').value,
                    content: this.querySelector('#announcementContent').value,
                    createdBy: user.email,
                    createdByUserId: user.uid,
                    createdAt: new Date()
                };

                // Validate required fields
                if (!formData.title || !formData.category || !formData.priority || !formData.content) {
                    showToast('❌ Please fill in all required fields.', 'error');
                    return;
                }

                // Show loader
                const submitBtn = document.getElementById('createAnnouncementBtn');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                if (btnText) btnText.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'inline-flex';
                submitBtn.disabled = true;

                FirestoreService.addDoc('announcements', formData).then(result => {
                    // Hide loader
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;

                    if (result.success) {
                        showToast('✅ Announcement posted successfully!', 'success');
                        announcementForm.reset();
                        loadAnnouncements(); // Refresh announcements list
                    } else {
                        showToast('❌ Error: ' + result.error, 'error');
                    }
                }).catch(error => {
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast('❌ Failed to post announcement: ' + error.message, 'error');
                });
            });
        }

        // Load announcements if on announcements page
        if (document.getElementById('announcementsContainer')) {
            loadAnnouncements();
        }

        // ==================== MARKETPLACE MANAGEMENT ====================
        const listingForm = document.getElementById('listingForm');
        const marketplaceListingsContainer = document.getElementById('marketplaceListingsContainer');
        const searchInput = document.getElementById('searchListings');
        const categoryButtons = document.querySelectorAll('.category-btn');

        let allListings = [];

        // Listing form submission
        if (listingForm) {
            listingForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast('❌ Please log in to post a listing.', 'error');
                    return;
                }

                const formData = {
                    title: this.querySelector('#listingTitle').value,
                    category: this.querySelector('#listingCategory').value,
                    price: parseFloat(this.querySelector('#listingPrice').value),
                    condition: this.querySelector('#listingCondition').value,
                    description: this.querySelector('#listingDescription').value,
                    sellerName: user.email.split('@')[0],
                    sellerEmail: user.email,
                    sellerId: user.uid,
                    createdAt: new Date()
                };

                // Validate required fields
                if (!formData.title || !formData.category || !formData.price || !formData.condition || !formData.description) {
                    showToast('❌ Please fill in all required fields.', 'error');
                    return;
                }

                // Show loader
                const submitBtn = document.getElementById('createListingBtn');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                if (btnText) btnText.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'inline-flex';
                submitBtn.disabled = true;

                FirestoreService.addDoc('marketplace_listings', formData).then(result => {
                    // Hide loader
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;

                    if (result.success) {
                        showToast('✅ Listing posted successfully!', 'success');
                        listingForm.reset();
                        loadMarketplaceListings(); // Refresh listings
                    } else {
                        showToast('❌ Error: ' + result.error, 'error');
                    }
                }).catch(error => {
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast('❌ Failed to post listing: ' + error.message, 'error');
                });
            });
        }

        // Load all marketplace listings from Firestore
        async function loadMarketplaceListings(filterCategory = 'All', searchTerm = '') {
            if (!marketplaceListingsContainer) return;

            try {
                const result = await FirestoreService.getAll('marketplace_listings', 'createdAt', 50);
                allListings = result.success ? result.data : [];

                // Filter by category
                let filtered = allListings;
                if (filterCategory && filterCategory !== 'All') {
                    filtered = filtered.filter(listing => listing.category === filterCategory);
                }

                // Filter by search term
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter(listing =>
                        (listing.title || '').toLowerCase().includes(term) ||
                        (listing.description || '').toLowerCase().includes(term)
                    );
                }

                if (filtered.length > 0) {
                    marketplaceListingsContainer.innerHTML = filtered.map(listing => {
                        const date = listing.createdAt?.seconds
                            ? new Date(listing.createdAt.seconds * 1000)
                            : new Date(listing.createdAt || Date.now());

                        return `
                            <div class="listing-card">
                                <div class="listing-image">
                                    <i class="fas ${getListingIcon(listing.category)}"></i>
                                </div>
                                <div class="listing-info">
                                    <span class="listing-category">${listing.category || 'Other'}</span>
                                    <h4>${listing.title || 'Untitled'}</h4>
                                    <p>${listing.description || ''}</p>
                                    <div class="listing-meta">
                                        <span class="seller">${listing.sellerName || 'Anonymous'}</span>
                                        <span class="date">${formatTimeAgo(date)}</span>
                                    </div>
                                    <div class="listing-price">
                                        <span class="price">₱${Number(listing.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    marketplaceListingsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-store"></i>
                            <p>No listings found${searchTerm || filterCategory !== 'All' ? ' matching your criteria' : ''}</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading marketplace listings:', error);
                marketplaceListingsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading listings</p>
                    </div>
                `;
            }
        }

        // Helper: get icon based on category
        function getListingIcon(category) {
            const icons = {
                'Electronics': 'fa-laptop',
                'Furniture': 'fa-couch',
                'Appliances': 'fa-blender',
                'Clothing': 'fa-tshirt',
                'Other': 'fa-box'
            };
            return icons[category] || 'fa-box';
        }

        // Helper: format time ago
        function formatTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60
            };
            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = Math.floor(seconds / secondsInUnit);
                if (interval >= 1) {
                    return `Posted ${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
                }
            }
            return 'Just now';
        }

        // Search input handler
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'All';
                loadMarketplaceListings(activeCategory, this.value);
            });
        }

        // Category filter buttons
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const category = this.dataset.category;
                const searchTerm = searchInput?.value || '';
                loadMarketplaceListings(category, searchTerm);
            });
        });

        // Load marketplace listings if on marketplace page
        if (document.getElementById('marketplaceListingsContainer')) {
            loadMarketplaceListings();
        }

        // ==================== END MARKETPLACE ====================

        // ==================== RECORDS MANAGEMENT ====================
        const recordForm = document.getElementById('recordForm');
        const recordsListContainer = document.getElementById('recordsListContainer');
        const recordItemInput = document.getElementById('recordItem');
        const recordDescriptionInput = document.getElementById('recordDescription');
        const recordRemarksInput = document.getElementById('recordRemarks');
        const recordIdInput = document.getElementById('recordId');
        const formTitle = document.getElementById('formTitle');
        const saveRecordBtn = document.getElementById('saveRecordBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');

        let currentEditingId = null;
        let allRecords = [];

        // Record form submission (Create or Update)
        if (recordForm) {
            recordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast('❌ Please log in to create a record.', 'error');
                    return;
                }

                const item = recordItemInput.value.trim();
                const description = recordDescriptionInput.value.trim();
                const remarks = recordRemarksInput.value.trim();

                if (!item || !description) {
                    showToast('❌ Item and Description are required.', 'error');
                    return;
                }

                const recordData = {
                    item,
                    description,
                    remarks: remarks || '',
                    createdBy: user.email,
                    createdByUserId: user.uid,
                    updatedAt: new Date()
                };

                if (currentEditingId) {
                    // Update existing record
                    FirestoreService.updateDoc('records', currentEditingId, recordData).then(result => {
                        if (result.success) {
                            showToast('✅ Record updated successfully!', 'success');
                            resetRecordForm();
                            loadRecords();
                        } else {
                            showToast('❌ Error: ' + result.error, 'error');
                        }
                    }).catch(error => {
                        showToast('❌ Failed to update record: ' + error.message, 'error');
                    });
                } else {
                    // Create new record
                    recordData.createdAt = new Date();
                    FirestoreService.addDoc('records', recordData).then(result => {
                        if (result.success) {
                            showToast('✅ Record created successfully!', 'success');
                            recordForm.reset();
                            loadRecords();
                        } else {
                            showToast('❌ Error: ' + result.error, 'error');
                        }
                    }).catch(error => {
                        showToast('❌ Failed to create record: ' + error.message, 'error');
                    });
                }
            });
        }

        // Load all records from Firestore
        async function loadRecords() {
            if (!recordsListContainer) return;

            try {
                const result = await FirestoreService.getAll('records', 'updatedAt', 100);
                allRecords = result.success ? result.data : [];
                if (result.success && allRecords.length > 0) {
                    recordsListContainer.innerHTML = result.data.map(record => {
                        const updatedAt = record.updatedAt?.seconds
                            ? new Date(record.updatedAt.seconds * 1000)
                            : new Date(record.updatedAt || Date.now());

                        const isEditing = currentEditingId === record.id;

                        return `
                            <div class="record-card ${isEditing ? 'editing' : ''}" data-id="${record.id}">
                                <div class="record-body">
                                    <h4>${escapeHtml(record.item || 'Untitled Item')}</h4>
                                    <p class="record-description">${escapeHtml(record.description || '')}</p>
                                    ${record.remarks ? `<p class="record-remarks"><strong>Remarks:</strong> ${escapeHtml(record.remarks)}</p>` : ''}
                                    <div class="record-meta">
                                        <span class="record-author">By: ${escapeHtml(record.createdBy?.split('@')[0] || 'Unknown')}</span>
                                        <span class="record-date">Updated: ${updatedAt.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="record-actions">
                                    <button class="action-btn edit-btn" onclick="editRecord('${record.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="action-btn delete-btn" onclick="deleteRecord('${record.id}', '${escapeHtml(record.item)}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    recordsListContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-folder-open"></i>
                            <p>No records yet</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading records:', error);
                recordsListContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading records</p>
                    </div>
                `;
            }
        }

        // Edit record - populate form
        window.editRecord = function(recordId) {
            const record = allRecords?.find(r => r.id === recordId);
            if (!record) {
                showToast('Record not found', 'error');
                return;
            }
            currentEditingId = recordId;
            recordItemInput.value = record.item || '';
            recordDescriptionInput.value = record.description || '';
            recordRemarksInput.value = record.remarks || '';
            formTitle.textContent = 'Edit Record';
            saveRecordBtn.textContent = 'Update Record';
            cancelEditBtn.style.display = 'inline-block';
            recordItemInput.focus();
            loadRecords(); // refresh to highlight editing card
        };

        // Delete record
        window.deleteRecord = function(recordId, recordName) {
            if (!confirm(`Are you sure you want to delete "${recordName}"?`)) return;

            FirestoreService.deleteDoc('records', recordId).then(result => {
                if (result.success) {
                    showToast('✅ Record deleted successfully!', 'success');
                    if (currentEditingId === recordId) {
                        resetRecordForm();
                    }
                    loadRecords();
                } else {
                    showToast('❌ Delete failed: ' + result.error, 'error');
                }
            }).catch(error => {
                showToast('❌ Delete failed: ' + error.message, 'error');
            });
        };

        // Reset record form
        function resetRecordForm() {
            currentEditingId = null;
            recordForm.reset();
            formTitle.textContent = 'Add New Record';
            saveRecordBtn.textContent = 'Save Record';
            cancelEditBtn.style.display = 'none';
        }

        // Cancel edit
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', resetRecordForm);
        }

        // Load records if on records page
        if (document.getElementById('recordsListContainer')) {
            loadRecords();
        }

        // ==================== END RECORDS MANAGEMENT ====================

        // ==================== USER MANAGEMENT (ADMIN) ====================
        const USERS_COLLECTION = 'users';
        let currentAdminUser = null;
        let usersData = [];

        // Check if current user is admin
        async function checkAdminStatus() {
            const user = firebase.auth().currentUser;
            if (!user) return false;
            
            try {
                const result = await FirestoreService.query(USERS_COLLECTION, 'email', '==', user.email);
                if (result.success && result.data.length > 0) {
                    const userData = result.data[0];
                    currentAdminUser = userData;
                    return userData.role === 'admin';
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
            return false;
        }

        // Show/hide admin nav based on role
        async function updateAdminNav() {
            const adminNav = document.getElementById('navUsers');
            if (adminNav) {
                const isAdmin = await checkAdminStatus();
                if (isAdmin) {
                    adminNav.style.display = 'flex';
                    document.body.classList.add('is-admin');
                } else {
                    adminNav.style.display = 'none';
                    document.body.classList.remove('is-admin');
                }
            }
        }

        // Load users list into table
         async function loadUsersList() {
             const tbody = document.getElementById('usersTableBody');
             if (!tbody) return;

             const result = await FirestoreService.getAll(USERS_COLLECTION, 'createdAt');
             if (result.success) {
                 usersData = result.data;
                 tbody.innerHTML = usersData.map(user => {
                     const date = user.createdAt?.toDate?.() ? user.createdAt.toDate().toLocaleString() : 'N/A';
                     return `
                         <tr>
                             <td>${user.id.slice(-6)}</td>
                             <td>${escapeHtml(user.firstName || '')}</td>
                             <td>${escapeHtml(user.email || '')}</td>
                             <td>
                                 <span class="role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">
                                     ${(user.role || 'user').toUpperCase()}
                                 </span>
                             </td>
                             <td>${date}</td>
                             <td>
                                 <button class="action-btn-sm view-btn" onclick="viewUser('${user.id}')">
                                     <i class="fas fa-eye"></i> View
                                 </button>
                                 <button class="action-btn-sm edit-btn" onclick="editUser(${user.id})">
                                     <i class="fas fa-edit"></i> Edit
                                 </button>
                                 <button class="action-btn-sm delete-btn" onclick="deleteUser(${user.id}, '${escapeHtml(user.firstName)}')">
                                     <i class="fas fa-trash"></i> Delete
                                 </button>
                             </td>
                         </tr>
                     `;
                 }).join('');
             } else {
                 tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error loading users</td></tr>`;
             }
         }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Reset add/edit form
        function resetUserForm() {
            document.getElementById('addUserForm').reset();
            document.getElementById('editUserId').value = '';
            document.getElementById('formTitle').textContent = 'Add New User';
            document.getElementById('submitUserBtn').textContent = '➣ Create User';
            document.getElementById('cancelEditBtn').style.display = 'none';
            document.getElementById('addPassword').required = true;
        }

        // View user - show popup modal
         window.viewUser = function(userId) {
             const user = usersData.find(u => u.id === userId);
             if (!user) return;

             document.getElementById('viewUserId').textContent = user.id.slice(-6);
             document.getElementById('viewUserFirstName').textContent = user.firstName || '-';
             document.getElementById('viewUserEmail').textContent = user.email || '-';
             document.getElementById('viewUserRole').textContent = (user.role || 'user').toUpperCase();
             
             const createdAt = user.createdAt?.toDate?.() 
                 ? user.createdAt.toDate().toLocaleString() 
                 : (user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A');
             document.getElementById('viewUserCreatedAt').textContent = createdAt;
             
             document.getElementById('viewUserPassword').textContent = '••••••••';

             document.getElementById('viewUserModal').classList.add('active');
         };

         // Close view user modal
         window.closeViewUserModal = function() {
             document.getElementById('viewUserModal').classList.remove('active');
         };

         // Close modals on outside click or Escape key
         document.addEventListener('click', function(e) {
             if (e.target.id === 'viewUserModal') {
                 closeViewUserModal();
             }
         });

         document.addEventListener('keydown', function(e) {
             if (e.key === 'Escape') {
                 closeViewUserModal();
             }
         });

         // Edit user - populate form
         window.editUser = async function(userId) {
            const user = usersData.find(u => u.id === userId);
            if (!user) return;

            document.getElementById('editUserId').value = user.id;
            document.getElementById('addFirstName').value = user.firstName || '';
            document.getElementById('addEmail').value = user.email || '';
            document.getElementById('addRole').value = user.role || 'user';
            document.getElementById('addPassword').value = '';
            document.getElementById('addPassword').required = false;

            document.getElementById('formTitle').textContent = 'Edit User';
            document.getElementById('submitUserBtn').textContent = '💾 Update User';
            document.getElementById('cancelEditBtn').style.display = 'inline-block';

            // Scroll to form
            document.querySelector('.user-form-card').scrollIntoView({ behavior: 'smooth' });
        };

        // Cancel edit
        document.getElementById('cancelEditBtn').addEventListener('click', resetUserForm);

        // Add/Update user form submission
        document.getElementById('addUserForm').addEventListener('button', async (e) => {
            e.preventDefault();
            
            const editUserId = document.getElementById('editUserId').value;
            const firstName = document.getElementById('addFirstName').value.trim();
            const email = document.getElementById('addEmail').value.trim().toLowerCase();
            const password = document.getElementById('addPassword').value;
            const role = document.getElementById('addRole').value;

            if (!firstName || !email) {
                showToast('First name and email are required', 'error');
                return;
            }

            if (!editUserId && !password) {
                showToast('Password is required when creating a new user', 'error');
                return;
            }

            try {
                if (editUserId) {
                    // Update existing user
                    const updateData = { firstName, email, role };
                    if (password) {
                        updateData.password = await hashPassword(password);
                    }
                    const result = await FirestoreService.updateDoc(USERS_COLLECTION, editUserId, updateData);
                    if (result.success) {
                        showToast(`User "${firstName}" updated successfully!`, 'success');
                        resetUserForm();
                        loadUsersList();
                    } else {
                        showToast('Update failed: ' + result.error, 'error');
                    }
                } else {
                    // Create new user - check email exists
                    const existing = await FirestoreService.query(USERS_COLLECTION, 'email', '==', email);
                    if (existing.success && existing.data.length > 0) {
                        showToast('Email already registered!', 'error');
                        return;
                    }

                    const newUser = {
                        firstName,
                        email,
                        password: await hashPassword(password),
                        role,
                        createdAt: new Date()
                    };

                    const result = await FirestoreService.addDoc(USERS_COLLECTION, newUser);
                    if (result.success) {
                        showToast(`User "${firstName}" created with role "${role}"!`, 'success');
                        resetUserForm();
                        loadUsersList();
                    } else {
                        showToast('Creation failed: ' + result.error, 'error');
                    }
                }
            } catch (error) {
                showToast('Operation failed: ' + error.message, 'error');
            }
        });

        // Delete user
        window.deleteUser = async function(userId, userName) {
            if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

            try {
                const result = await FirestoreService.deleteDoc(USERS_COLLECTION, userId);
                if (result.success) {
                    showToast(`User "${userName}" deleted`, 'success');
                    loadUsersList();
                } else {
                    showToast('Delete failed: ' + result.error, 'error');
                }
            } catch (error) {
                showToast('Delete failed: ' + error.message, 'error');
            }
        };

        // Simple password hashing
        async function hashPassword(str) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Page navigation handler for users page
        function initUserManagement() {
            const usersNav = document.getElementById('navUsers');
            const usersPage = document.getElementById('users-page');
            
            if (!usersPage || !usersNav) return;

            // Show users page when nav clicked
            usersNav.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentAdminUser) {
                    showToast('⚠️ Admin access required', 'warning');
                    return;
                }
                showPage('users');
            });

            // Load users when page becomes visible
            const observer = new MutationObserver(() => {
                if (!usersPage.classList.contains('hidden')) {
                    loadUsersList();
                }
            });
            observer.observe(usersPage, { attributes: true, attributeFilter: ['class'] });
        }

        // Initialize after auth state
        updateAdminNav();
        initUserManagement();

        // ==================== END USER MANAGEMENT ====================
     }

     // Call init after definition
     init();
});
