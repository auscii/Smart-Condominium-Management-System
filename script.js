document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const appContainer = document.getElementById('appContainer');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const actionBtns = document.querySelectorAll('.action-btn');
    const logoutBtn = document.getElementById('logoutBtn');
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

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginOverlay.classList.add('hidden');
        appContainer.classList.add('active');
    });

    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', function() {
        sidebar.classList.remove('active');
    });

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(pageId + '-page').classList.remove('hidden');
            
            if (window.innerWidth < 768) {
                sidebar.classList.remove('active');
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
            
            if (window.innerWidth < 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        appContainer.classList.remove('active');
        loginOverlay.classList.remove('hidden');
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

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Booking confirmed! Check your reservations for details.');
        bookingModal.classList.remove('active');
        bookingForm.reset();
    });

    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Maintenance request submitted successfully!');
            maintenanceForm.reset();
        });
    }

    if (visitorForm) {
        visitorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Visitor registered successfully!');
            visitorForm.reset();
        });
    }

    settingsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Settings saved successfully!');
        });
    });

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
                
                if (this.querySelector('.fa-plus')) {
                    scale = Math.min(scale + 0.1, 1.5);
                } else {
                    scale = Math.max(scale - 0.1, 0.5);
                }
                
                viewer3d.style.transform = 'scale(' + scale + ')';
            }
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            sidebar.classList.remove('active');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
            bookingModal.classList.remove('active');
        }
    });
});
