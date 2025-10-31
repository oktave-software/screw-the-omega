"use strict";
class OmegaViewer {
    constructor() {
        // Initialize page configuration
        this.config = {
            pages: [
                'images/Pg1.png',
                'images/Pg2.png',
                'images/Pg3.png',
                'images/Pg4.png',
                'images/Pg5.png',
                'images/Pg6.png',
                'images/Pg7.png',
                'images/Pg8.png',
                'images/Pg9.png',
                'images/Pg10.png',
                'images/Pg11.png',
                'images/Pg12.png',
                'images/Pg13.png',
                'images/Pg14.png',
                'images/Pg15.png',
                'images/Pg16.png',
                'images/Pg17.png',
                'images/Pg18.png',
                'images/Pg19.png',
                'images/Pg20.png',
                'images/Pg21.png',
                'images/Pg22.png',
                'images/Pg23.png',
                'images/Pg24.png',
                'images/Pg25.png',
                'images/Pg26.png',
                'images/Pg27.png',
                'images/Pg28.png',
                'images/Pg29.png',
                'images/Pg30.png',
                'images/Pg31.png',
                'images/Pg32.png',
                'images/Pg33.png',
                'images/Pg34.png'
            ],
            currentPage: 0
        };
        this.loadedImages = new Map();
        this.isInfiniteScrollMode = true;
        this.scrollTimeout = null;
        // Get DOM elements
        this.pageContainer = document.getElementById('page-container');
        this.currentPageElement = document.getElementById('current-page');
        this.totalPagesElement = document.getElementById('total-pages');
        this.loadingElement = document.getElementById('loading');
        this.navLeft = document.getElementById('nav-left');
        this.navRight = document.getElementById('nav-right');
        this.init();
    }
    init() {
        // Set total pages
        this.totalPagesElement.textContent = this.config.pages.length.toString();
        // Load first page
        this.loadInitialPage(0);
        // Add event listeners
        this.setupEventListeners();
        // Preload next 2 and previous 2 images from starting page
        this.preloadAdjacentImages(0);
    }
    setupEventListeners() {
        // Scroll event for infinite scrolling
        window.addEventListener('scroll', () => this.handleScroll());
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            }
            else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });
        // Click navigation
        this.navLeft.addEventListener('click', () => this.previousPage());
        this.navRight.addEventListener('click', () => this.nextPage());
        // Touch swipe navigation
        this.setupTouchNavigation();
        // Prevent context menu on long press (mobile)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    setupTouchNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swiped left - next page
                    this.nextPage();
                }
                else {
                    // Swiped right - previous page
                    this.previousPage();
                }
            }
        };
        this.handleSwipe = handleSwipe;
    }
    handleSwipe() {
        // This will be set by setupTouchNavigation
    }
    handleScroll() {
        if (!this.isInfiniteScrollMode)
            return;
        // Debounce scroll event
        if (this.scrollTimeout !== null) {
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = window.setTimeout(() => {
            this.checkAndLoadAdjacentImages();
            this.updateCurrentPageIndicator();
        }, 100);
    }
    checkAndLoadAdjacentImages() {
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const threshold = viewportHeight * 1.5; // Load when within 1.5 viewports (preload earlier)
        const header = document.getElementById('header');
        const headerOffset = header ? header.offsetHeight : 0;
        // Check if we need to load next image
        const lastImage = this.getLastLoadedImage();
        if (lastImage) {
            const lastImageBottom = lastImage.element.offsetTop + lastImage.element.offsetHeight;
            if (scrollTop + viewportHeight + threshold > lastImageBottom) {
                const nextIndex = lastImage.pageIndex + 1;
                if (nextIndex < this.config.pages.length && !this.loadedImages.has(nextIndex)) {
                    this.loadImageAtEnd(nextIndex);
                }
            }
        }
        // Check if we need to load previous image - only if we haven't reached the first page
        const firstImage = this.getFirstLoadedImage();
        if (firstImage && firstImage.pageIndex > 0) {
            const firstImageTop = firstImage.element.offsetTop;
            if (scrollTop - threshold < firstImageTop) {
                const prevIndex = firstImage.pageIndex - 1;
                if (prevIndex >= 0 && !this.loadedImages.has(prevIndex)) {
                    this.loadImageAtStart(prevIndex);
                }
            }
        }
    }
    preloadImage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.config.pages.length)
            return;
        // Just preload into cache, don't add to DOM
        const img = new Image();
        img.src = this.config.pages[pageIndex];
    }
    updateCurrentPageIndicator() {
        const scrollTop = window.scrollY + window.innerHeight / 2;
        // Find which image is currently in view
        let currentImageIndex = this.config.currentPage;
        for (const [pageIndex, loadedImage] of this.loadedImages) {
            const imageTop = loadedImage.element.offsetTop;
            const imageBottom = imageTop + loadedImage.element.offsetHeight;
            if (scrollTop >= imageTop && scrollTop <= imageBottom) {
                currentImageIndex = pageIndex;
                break;
            }
        }
        if (currentImageIndex !== this.config.currentPage) {
            this.config.currentPage = currentImageIndex;
            this.currentPageElement.textContent = (currentImageIndex + 1).toString();
            // When page changes, preload adjacent images
            this.preloadAdjacentImages(currentImageIndex);
        }
    }
    preloadAdjacentImages(pageIndex) {
        // Preload next 2 images
        this.preloadImage(pageIndex + 1);
        this.preloadImage(pageIndex + 2);
        // Preload previous 2 images
        this.preloadImage(pageIndex - 1);
        this.preloadImage(pageIndex - 2);
    }
    loadInitialPage(pageIndex) {
        this.config.currentPage = pageIndex;
        this.currentPageElement.textContent = (pageIndex + 1).toString();
        this.loadImageAtEnd(pageIndex);
    }
    loadImageAtEnd(pageIndex) {
        if (this.loadedImages.has(pageIndex))
            return;
        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;
        const loadedImage = {
            element: img,
            pageIndex: pageIndex
        };
        img.onload = () => {
            // Image loaded successfully
        };
        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
        };
        img.src = this.config.pages[pageIndex];
        this.pageContainer.appendChild(img);
        this.loadedImages.set(pageIndex, loadedImage);
    }
    loadImageAtStart(pageIndex) {
        if (this.loadedImages.has(pageIndex))
            return;
        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;
        const loadedImage = {
            element: img,
            pageIndex: pageIndex
        };
        // Store current scroll position
        const currentScrollHeight = document.documentElement.scrollHeight;
        const currentScrollTop = window.scrollY;
        img.onload = () => {
            // Restore scroll position after image loads
            const newScrollHeight = document.documentElement.scrollHeight;
            const heightDiff = newScrollHeight - currentScrollHeight;
            window.scrollTo(0, currentScrollTop + heightDiff);
        };
        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
        };
        img.src = this.config.pages[pageIndex];
        this.pageContainer.insertBefore(img, this.pageContainer.firstChild);
        this.loadedImages.set(pageIndex, loadedImage);
    }
    getFirstLoadedImage() {
        let first = null;
        for (const [_, loadedImage] of this.loadedImages) {
            if (first === null || loadedImage.pageIndex < first.pageIndex) {
                first = loadedImage;
            }
        }
        return first;
    }
    getLastLoadedImage() {
        let last = null;
        for (const [_, loadedImage] of this.loadedImages) {
            if (last === null || loadedImage.pageIndex > last.pageIndex) {
                last = loadedImage;
            }
        }
        return last;
    }
    nextPage() {
        if (this.config.currentPage < this.config.pages.length - 1) {
            const nextIndex = this.config.currentPage + 1;
            this.navigateToPage(nextIndex);
        }
    }
    previousPage() {
        if (this.config.currentPage > 0) {
            const prevIndex = this.config.currentPage - 1;
            this.navigateToPage(prevIndex);
        }
    }
    navigateToPage(pageIndex) {
        // Clear all loaded images and load just this page
        this.isInfiniteScrollMode = false;
        this.pageContainer.innerHTML = '';
        this.loadedImages.clear();
        this.config.currentPage = pageIndex;
        this.currentPageElement.textContent = (pageIndex + 1).toString();
        this.loadImageAtEnd(pageIndex);
        // Preload adjacent images
        this.preloadAdjacentImages(pageIndex);
        // Scroll to viewer (skip header)
        const header = document.getElementById('header');
        const headerOffset = header ? header.offsetHeight : 0;
        window.scrollTo(0, headerOffset);
        // Re-enable infinite scroll after a short delay
        setTimeout(() => {
            this.isInfiniteScrollMode = true;
        }, 500);
    }
    showLoading() {
        this.loadingElement.classList.add('active');
    }
    hideLoading() {
        this.loadingElement.classList.remove('active');
    }
}
// Initialize the viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OmegaViewer();
});
