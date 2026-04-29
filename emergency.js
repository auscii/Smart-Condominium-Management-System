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
    // const emailInput = loginForm.querySelector('input[type="email"]');
    // const passwordInput = loginForm.querySelector('input[type="password"]');
    // const togglePasswordBtn = document.querySelector('.toggle-password');
    // const logoutBtn = document.getElementById('logoutBtn');

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
});