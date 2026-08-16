// JavaScript for MBD College Doora Frontend Preview

document.addEventListener('DOMContentLoaded', function() {
    // 1. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
        
        // Close menu on link click (for mobile experience)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // 2. Portal/Dashboard Tab Toggling
    const sidebarLinks = document.querySelectorAll('.portal-menu a[data-tab]');
    const tabContents = document.querySelectorAll('.portal-tab-content');

    if (sidebarLinks.length > 0 && tabContents.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active classes
                sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active classes
                this.parentElement.classList.add('active');
                const targetTabId = this.getAttribute('data-tab');
                const targetTab = document.getElementById(targetTabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
    }

    // 3. Notice & Event Modal Viewer
    const viewButtons = document.querySelectorAll('.view-detail-btn');
    const modal = document.getElementById('details-modal');
    const modalTitle = document.getElementById('modal-title-text');
    const modalBody = document.getElementById('modal-body-text');
    const modalClose = document.querySelector('.modal-close');

    if (viewButtons.length > 0 && modal && modalTitle && modalBody) {
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const title = this.getAttribute('data-title');
                const details = this.getAttribute('data-details');
                
                modalTitle.textContent = title;
                modalBody.innerHTML = details;
                modal.style.display = 'flex';
            });
        });

        if (modalClose) {
            modalClose.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }

        // Close on background click
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // 4. Photo Gallery Lightbox
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (galleryItems.length > 0 && lightbox && lightboxImg && lightboxCaption) {
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                const caption = this.querySelector('.gallery-overlay').textContent;
                
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxCaption.textContent = caption;
                    lightbox.style.display = 'flex';
                }
            });
        });

        if (lightboxClose) {
            lightboxClose.addEventListener('click', function() {
                lightbox.style.display = 'none';
            });
        }

        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target === lightboxClose) {
                lightbox.style.display = 'none';
            }
        });
    }
});
