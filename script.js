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
    const towerBtns = document.querySelectorAll('.tower-btn');
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

    // Toggle password visibility
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
                showToast('✅ Logged out successfully', 'success');
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

        loadReservations(user.uid);
    }

    // Load user's reservations from Firestore
    async function loadReservations(userId) {
        try {
            const result = await FirestoreService.query('reservations', 'userId', '==', userId);
            const reservationsList = document.querySelector('.reservations-list');
            
            if (result.success && result.data.length > 0) {
                if (reservationsList) {
                    reservationsList.innerHTML = result.data.map(res => {
                        const date = res.date ? new Date(res.date) : new Date(res.createdAt?.seconds * 1000 || Date.now());
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
                                ${res.status !== 'cancelled' ? 
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
        if (confirm('Are you sure you want to cancel this reservation?')) {
            const result = await FirestoreService.deleteDoc('reservations', reservationId);
            if (result.success) {
                const user = firebase.auth().currentUser;
                if (user) loadReservations(user.uid);
                showToast('✅ Reservation cancelled', 'success');
            } else {
                showToast('❌ Error: ' + result.error, 'error');
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
        });
    });

    towerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            towerBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

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
                    showToast('✅ Booking confirmed!', 'success');
                    bookingModal.classList.remove('active');
                    bookingForm.reset();
                    loadReservations(user.uid);
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Maintenance form
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('❌ Please log in to submit a request.', 'error');
                return;
            }

            const formData = {
                category: this.querySelector('select').value,
                priority: this.querySelectorAll('select')[1].value,
                subject: this.querySelector('input[type="text"]').value,
                description: this.querySelector('textarea').value,
                status: 'open',
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date()
            };

            FirestoreService.addDoc('maintenance_requests', formData).then(result => {
                if (result.success) {
                    showToast('✅ Maintenance request submitted!', 'success');
                    maintenanceForm.reset();
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Visitor form
    if (visitorForm) {
        visitorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('❌ Please log in to register a visitor.', 'error');
                return;
            }

            const formData = {
                name: this.querySelector('input[type="text"]').value,
                purpose: this.querySelector('select').value,
                date: this.querySelector('input[type="date"]').value,
                time: this.querySelector('input[type="time"]').value,
                registeredBy: user.email,
                status: 'registered',
                createdAt: new Date()
            };

            FirestoreService.addDoc('visitors', formData).then(result => {
                if (result.success) {
                    showToast('✅ Visitor registered!', 'success');
                    visitorForm.reset();
                } else {
                    showToast('❌ Error: ' + result.error, 'error');
                }
            });
        });
    }

    // Settings forms
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('✅ Settings saved!', 'success');
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

    // Initialize (reservations load after login via loadUserData)
});
