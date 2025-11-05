"use strict";
class OmegaViewer {
    constructor() {
        const pages = ['images/Cover1.png'];
        for (let i = 1; i <= 34; i++) {
            pages.push(`images/Pg${i}.png`);
        }
        this.config = {
            pages: pages,
            currentPage: 0
        };
        this.loadedImages = new Map();
        this.isInfiniteScrollMode = true;
        this.scrollTimeout = null;
        this.zoomLevel = 1.0;
        this.minZoom = 1.0;
        this.maxZoom = 5.0;
        this.translateX = 0;
        this.translateY = 0;
        this.pageContainer = this.getRequiredElement('page-container');
        this.currentPageElement = this.getRequiredElement('current-page');
        this.totalPagesElement = this.getRequiredElement('total-pages');
        this.navLeft = this.getRequiredElement('nav-left');
        this.navRight = this.getRequiredElement('nav-right');
        this.header = document.getElementById('header');
        this.footer = document.getElementById('footer');
        this.pageIndicator = document.getElementById('page-indicator');
        this.boundHandleScroll = () => this.handleScroll();
        this.boundHandleKeydown = (e) => this.handleKeydown(e);
        this.boundContextMenu = (e) => e.preventDefault();
        this.boundTouchStart = () => { };
        this.boundTouchEnd = () => { };
        this.boundTouchMove = () => { };
        this.boundPinchTouchStart = () => { };
        this.boundPinchTouchMove = () => { };
        this.boundPanTouchStart = () => { };
        this.boundPanTouchMove = () => { };
        this.boundPanTouchEnd = () => { };
        this.boundPanTouchCancel = () => { };
        this.init();
    }
    getRequiredElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required element #${id} not found in DOM`);
        }
        return element;
    }
    init() {
        this.totalPagesElement.textContent = this.config.pages.length.toString();
        this.setupEventListeners();
        this.preloadAllImages();
        this.updatePageIndicatorVisibility();
    }
    preloadAllImages() {
        this.config.currentPage = 0;
        this.currentPageElement.textContent = '1';
        this.loadImageSequentially(0, OmegaViewer.INITIAL_IMAGES_TO_LOAD);
    }
    loadImageSequentially(pageIndex, priorityCount) {
        if (pageIndex >= this.config.pages.length) {
            return;
        }
        this.loadImageWithCallback(pageIndex, () => {
            if (pageIndex < priorityCount - 1) {
                this.loadImageSequentially(pageIndex + 1, priorityCount);
            }
            else if (pageIndex === priorityCount - 1) {
                this.loadRemainingImagesInBackground(priorityCount);
            }
            else {
                this.loadImageSequentially(pageIndex + 1, priorityCount);
            }
        });
    }
    loadRemainingImagesInBackground(startIndex) {
        if (startIndex < this.config.pages.length) {
            this.loadImageSequentially(startIndex, this.config.pages.length);
        }
    }
    loadImageWithCallback(pageIndex, onComplete) {
        if (this.loadedImages.has(pageIndex)) {
            onComplete();
            return;
        }
        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;
        const loadedImage = {
            element: img,
            pageIndex: pageIndex
        };
        img.onload = () => {
            onComplete();
        };
        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
            img.classList.add('omega-page-error');
            img.alt = `Failed to load page ${pageIndex + 1}`;
            onComplete();
        };
        img.src = this.config.pages[pageIndex];
        this.pageContainer.appendChild(img);
        this.loadedImages.set(pageIndex, loadedImage);
    }
    handleKeydown(e) {
        if (e.key === 'ArrowLeft') {
            this.previousPage();
        }
        else if (e.key === 'ArrowRight') {
            this.nextPage();
        }
    }
    setupEventListeners() {
        window.addEventListener('scroll', this.boundHandleScroll);
        document.addEventListener('keydown', this.boundHandleKeydown);
        this.navLeft.addEventListener('click', (e) => {
            if (this.isClickInViewerArea(e)) {
                e.preventDefault();
                this.previousPage();
            }
        });
        this.navRight.addEventListener('click', (e) => {
            if (this.isClickInViewerArea(e)) {
                e.preventDefault();
                this.nextPage();
            }
        });
        this.navLeft.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.previousPage();
            }
        });
        this.navRight.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.nextPage();
            }
        });
        this.setupTouchNavigation();
        this.setupPinchZoom();
        this.setupPanDrag();
        this.pageContainer.addEventListener('contextmenu', this.boundContextMenu);
    }
    setupTouchNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchIdentifier = null;
        this.boundTouchStart = (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchIdentifier = e.touches[0].identifier;
            }
            else {
                touchIdentifier = null;
            }
        };
        this.boundTouchEnd = (e) => {
            if (touchIdentifier !== null && e.changedTouches.length === 1) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdentifier);
                if (touch) {
                    touchEndX = touch.clientX;
                    this.handleSwipe(touchStartX, touchEndX, touchStartY);
                }
            }
            touchIdentifier = null;
        };
        document.addEventListener('touchstart', this.boundTouchStart);
        document.addEventListener('touchend', this.boundTouchEnd);
    }
    handleSwipe(startX, endX, startY) {
        const diff = startX - endX;
        if (!this.isTouchInViewerArea(startY)) {
            return;
        }
        if (Math.abs(diff) > OmegaViewer.SWIPE_THRESHOLD_PX) {
            if (diff > 0) {
                this.nextPage();
            }
            else {
                this.previousPage();
            }
        }
    }
    setupPinchZoom() {
        let initialDistance = 0;
        let initialZoom = 1.0;
        let initialTranslateX = 0;
        let initialTranslateY = 0;
        let pinchCenterX = 0;
        let pinchCenterY = 0;
        let isPinching = false;
        const getDistance = (touch1, touch2) => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };
        const getPinchCenter = (touch1, touch2) => {
            return {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        };
        this.boundPinchTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                isPinching = true;
                initialDistance = getDistance(e.touches[0], e.touches[1]);
                initialZoom = this.zoomLevel;
                initialTranslateX = this.translateX;
                initialTranslateY = this.translateY;
                const center = getPinchCenter(e.touches[0], e.touches[1]);
                pinchCenterX = center.x;
                pinchCenterY = center.y;
            }
            else {
                isPinching = false;
            }
        };
        this.boundPinchTouchMove = (e) => {
            if (e.touches.length === 2 && isPinching) {
                e.preventDefault();
                const currentDistance = getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, initialZoom * scale));
                if (newZoom !== this.zoomLevel) {
                    const contentX = (pinchCenterX - initialTranslateX) / initialZoom;
                    const contentY = (pinchCenterY - initialTranslateY) / initialZoom;
                    this.zoomLevel = newZoom;
                    this.translateX = pinchCenterX - (contentX * newZoom);
                    this.translateY = pinchCenterY - (contentY * newZoom);
                    this.applyTransform();
                }
            }
        };
        document.addEventListener('touchstart', this.boundPinchTouchStart, { passive: false });
        document.addEventListener('touchmove', this.boundPinchTouchMove, { passive: false });
    }
    applyTransform() {
        // Apply transform to container instead of individual images (industry standard)
        this.pageContainer.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
        this.pageContainer.style.transformOrigin = '0 0';
    }
    setupPanDrag() {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let initialTranslateX = 0;
        let initialTranslateY = 0;
        let dragTouchId = null;
        this.boundPanTouchStart = (e) => {
            if (e.touches.length === 1 && this.zoomLevel > 1.0) {
                isDragging = true;
                dragTouchId = e.touches[0].identifier;
                dragStartX = e.touches[0].clientX;
                dragStartY = e.touches[0].clientY;
                initialTranslateX = this.translateX;
                initialTranslateY = this.translateY;
            }
            else {
                isDragging = false;
                dragTouchId = null;
            }
        };
        this.boundPanTouchMove = (e) => {
            if (isDragging && e.touches.length === 1 && dragTouchId !== null) {
                const touch = Array.from(e.touches).find(t => t.identifier === dragTouchId);
                if (touch) {
                    e.preventDefault();
                    const deltaX = touch.clientX - dragStartX;
                    const deltaY = touch.clientY - dragStartY;
                    this.translateX = initialTranslateX + deltaX;
                    this.translateY = initialTranslateY + deltaY;
                    this.applyTransform();
                }
            }
        };
        this.boundPanTouchEnd = () => {
            isDragging = false;
            dragTouchId = null;
        };
        this.boundPanTouchCancel = () => {
            isDragging = false;
            dragTouchId = null;
        };
        this.pageContainer.addEventListener('touchstart', this.boundPanTouchStart);
        this.pageContainer.addEventListener('touchmove', this.boundPanTouchMove, { passive: false });
        this.pageContainer.addEventListener('touchend', this.boundPanTouchEnd);
        this.pageContainer.addEventListener('touchcancel', this.boundPanTouchCancel);
    }
    isClickInViewerArea(e) {
        const headerRect = this.header ? this.header.getBoundingClientRect() : null;
        const footerRect = this.footer ? this.footer.getBoundingClientRect() : null;
        const clickY = e.clientY;
        if (headerRect && clickY < headerRect.bottom) {
            return false;
        }
        if (footerRect && clickY > footerRect.top) {
            return false;
        }
        return true;
    }
    isTouchInViewerArea(touchY) {
        const scrollY = window.scrollY;
        const absoluteTouchY = touchY + scrollY;
        const headerHeight = this.header ? this.header.offsetHeight : 0;
        const footerTop = this.footer ? this.footer.offsetTop : document.documentElement.scrollHeight;
        if (absoluteTouchY < headerHeight) {
            return false;
        }
        if (absoluteTouchY > footerTop) {
            return false;
        }
        return true;
    }
    handleScroll() {
        if (!this.isInfiniteScrollMode)
            return;
        if (this.scrollTimeout !== null) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        this.scrollTimeout = window.setTimeout(() => {
            this.checkAndLoadAdjacentImages();
            this.updateCurrentPageIndicator();
            this.updatePageIndicatorVisibility();
            this.scrollTimeout = null;
        }, OmegaViewer.SCROLL_DEBOUNCE_MS);
    }
    destroy() {
        if (this.scrollTimeout !== null) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        window.removeEventListener('scroll', this.boundHandleScroll);
        document.removeEventListener('keydown', this.boundHandleKeydown);
        document.removeEventListener('touchstart', this.boundTouchStart);
        document.removeEventListener('touchend', this.boundTouchEnd);
        document.removeEventListener('touchstart', this.boundPinchTouchStart);
        document.removeEventListener('touchmove', this.boundPinchTouchMove);
        this.pageContainer.removeEventListener('touchstart', this.boundPanTouchStart);
        this.pageContainer.removeEventListener('touchmove', this.boundPanTouchMove);
        this.pageContainer.removeEventListener('touchend', this.boundPanTouchEnd);
        this.pageContainer.removeEventListener('touchcancel', this.boundPanTouchCancel);
        this.pageContainer.removeEventListener('contextmenu', this.boundContextMenu);
    }
    updatePageIndicatorVisibility() {
        if (!this.pageIndicator)
            return;
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollBottom = scrollTop + viewportHeight;
        const headerHeight = this.header ? this.header.offsetHeight : 0;
        const footerTop = this.footer ? this.footer.offsetTop : document.documentElement.scrollHeight;
        const isInHeader = scrollBottom < headerHeight + viewportHeight * OmegaViewer.HEADER_VISIBILITY_THRESHOLD;
        const isInFooter = scrollTop > footerTop - viewportHeight * OmegaViewer.FOOTER_VISIBILITY_THRESHOLD;
        if (isInHeader || isInFooter) {
            this.pageIndicator.style.display = 'none';
        }
        else {
            this.pageIndicator.style.display = 'block';
        }
    }
    checkAndLoadAdjacentImages() {
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const threshold = viewportHeight * OmegaViewer.LOAD_THRESHOLD_MULTIPLIER;
        const headerOffset = this.header ? this.header.offsetHeight : 0;
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
        const img = new Image();
        img.src = this.config.pages[pageIndex];
    }
    updateCurrentPageIndicator() {
        const scrollTop = window.scrollY + window.innerHeight / 2;
        let currentImageIndex = this.config.currentPage;
        for (const [pageIndex, loadedImage] of this.loadedImages.entries()) {
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
            this.preloadAdjacentImages(currentImageIndex);
        }
    }
    preloadAdjacentImages(pageIndex) {
        this.preloadImage(pageIndex + 1);
        this.preloadImage(pageIndex + 2);
        this.preloadImage(pageIndex - 1);
        this.preloadImage(pageIndex - 2);
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
        img.onload = () => { };
        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
            img.classList.add('omega-page-error');
            img.alt = `Failed to load page ${pageIndex + 1}`;
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
        const currentScrollHeight = document.documentElement.scrollHeight;
        const currentScrollTop = window.scrollY;
        img.onload = () => {
            const newScrollHeight = document.documentElement.scrollHeight;
            const heightDiff = newScrollHeight - currentScrollHeight;
            window.scrollTo(0, currentScrollTop + heightDiff);
        };
        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
            img.classList.add('omega-page-error');
            img.alt = `Failed to load page ${pageIndex + 1}`;
        };
        img.src = this.config.pages[pageIndex];
        this.pageContainer.insertBefore(img, this.pageContainer.firstChild);
        this.loadedImages.set(pageIndex, loadedImage);
    }
    getFirstLoadedImage() {
        let first = null;
        for (const loadedImage of this.loadedImages.values()) {
            if (first === null || loadedImage.pageIndex < first.pageIndex) {
                first = loadedImage;
            }
        }
        return first;
    }
    getLastLoadedImage() {
        let last = null;
        for (const loadedImage of this.loadedImages.values()) {
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
        this.isInfiniteScrollMode = false;
        this.pageContainer.innerHTML = '';
        this.loadedImages.clear();
        this.zoomLevel = 1.0;
        this.translateX = 0;
        this.translateY = 0;
        this.config.currentPage = pageIndex;
        this.currentPageElement.textContent = (pageIndex + 1).toString();
        this.loadImageAtEnd(pageIndex);
        this.preloadAdjacentImages(pageIndex);
        const headerOffset = this.header ? this.header.offsetHeight : 0;
        window.scrollTo(0, headerOffset);
        this.updatePageIndicatorVisibility();
        setTimeout(() => {
            this.isInfiniteScrollMode = true;
        }, OmegaViewer.INFINITE_SCROLL_DELAY_MS);
    }
}
// Configuration constants
OmegaViewer.SCROLL_DEBOUNCE_MS = 100;
OmegaViewer.LOAD_THRESHOLD_MULTIPLIER = 1.5;
OmegaViewer.HEADER_VISIBILITY_THRESHOLD = 0.3;
OmegaViewer.FOOTER_VISIBILITY_THRESHOLD = 0.7;
OmegaViewer.INFINITE_SCROLL_DELAY_MS = 500;
OmegaViewer.SWIPE_THRESHOLD_PX = 50;
OmegaViewer.INITIAL_IMAGES_TO_LOAD = 5;
document.addEventListener('DOMContentLoaded', () => {
    new OmegaViewer();
});
