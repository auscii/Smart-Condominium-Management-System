// Authentication Script for Sign Up Page
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const submitBtn = document.getElementById('submitBtn');

    // Toggle password visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Handle form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const unitNumber = document.getElementById('unitNumber').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const termsAccepted = document.getElementById('terms').checked;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            showToast('❌ Please fill in all required fields.', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('❌ Password must be at least 6 characters.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('❌ Passwords do not match.', 'error');
            return;
        }

        if (!termsAccepted) {
            showToast('❌ Please accept the Terms of Service and Privacy Policy.', 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Create user with Firebase Authentication
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // Update user profile with display name
                return user.updateProfile({
                    displayName: `${firstName} ${lastName}`
                }).then(() => {
                    // Save additional user data to Firestore
                    const userData = {
                        uid: user.uid,
                        email: user.email,
                        firstName: firstName,
                        lastName: lastName,
                        displayName: `${firstName} ${lastName}`,
                        unitNumber: unitNumber || null,
                        phone: phone || null,
                        role: 'resident',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    return FirestoreService.addDoc('users', userData);
                });
            })
            .then((result) => {
                if (result && result.success) {
                    showToast('✅ Account created successfully! Please sign in.', 'success');
                    
                    // Auto-redirect to login page after success
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    throw new Error('Failed to save user data');
                }
            })
            .catch((error) => {
                console.error('Signup error:', error);
                let errorMessage = 'Account creation failed. ';
                
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage += 'This email is already registered.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'Invalid email address.';
                        break;
                    case 'auth/weak-password':
                        errorMessage += 'Password is too weak.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage += 'Email/password accounts are not enabled.';
                        break;
                    default:
                        errorMessage += error.message;
                }
                
                showToast('❌ ' + errorMessage, 'error');
            })
            .finally(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            });
    });

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

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    };

    // Forgot password handler
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Enter your email address to reset password:');
            if (email) {
                firebase.auth().sendPasswordResetEmail(email)
                    .then(() => {
                        showToast('✅ Password reset email sent! Check your inbox.', 'success');
                    })
                    .catch((error) => {
                        showToast('❌ Error: ' + error.message, 'error');
                    });
            }
        });
    }

    // Terms link
    const termsLink = document.getElementById('termsLink');
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('ℹ️ Terms of Service page would open here.', 'info');
        });
    }

    // Privacy link
    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('ℹ️ Privacy Policy page would open here.', 'info');
        });
    }
});
