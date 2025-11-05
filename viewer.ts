interface OmegaConfig {
    pages: string[];
    currentPage: number;
}

interface LoadedImage {
    element: HTMLImageElement;
    pageIndex: number;
}

class OmegaViewer {
    // Configuration constants
    private static readonly SCROLL_DEBOUNCE_MS = 100;
    private static readonly LOAD_THRESHOLD_MULTIPLIER = 1.5;
    private static readonly HEADER_VISIBILITY_THRESHOLD = 0.3;
    private static readonly FOOTER_VISIBILITY_THRESHOLD = 0.7;
    private static readonly INFINITE_SCROLL_DELAY_MS = 500;
    private static readonly SWIPE_THRESHOLD_PX = 50;
    private static readonly INITIAL_IMAGES_TO_LOAD = 5;

    private config: OmegaConfig;
    private pageContainer: HTMLElement;
    private currentPageElement: HTMLElement;
    private totalPagesElement: HTMLElement;
    private navLeft: HTMLElement;
    private navRight: HTMLElement;
    private loadedImages: Map<number, LoadedImage>;
    private isInfiniteScrollMode: boolean;
    private scrollTimeout: ReturnType<typeof setTimeout> | null;
    private zoomLevel: number;
    private minZoom: number;
    private maxZoom: number;
    private translateX: number;
    private translateY: number;

    // Cached DOM elements
    private header: HTMLElement | null;
    private footer: HTMLElement | null;
    private pageIndicator: HTMLElement | null;

    // Bound event handlers for cleanup
    private boundHandleScroll: () => void;
    private boundHandleKeydown: (e: KeyboardEvent) => void;
    private boundTouchStart: (e: TouchEvent) => void;
    private boundTouchEnd: (e: TouchEvent) => void;
    private boundTouchMove: (e: TouchEvent) => void;
    private boundPinchTouchStart: (e: TouchEvent) => void;
    private boundPinchTouchMove: (e: TouchEvent) => void;
    private boundPanTouchStart: (e: TouchEvent) => void;
    private boundPanTouchMove: (e: TouchEvent) => void;
    private boundPanTouchEnd: () => void;
    private boundPanTouchCancel: () => void;
    private boundContextMenu: (e: Event) => void;

    constructor() {
        const pages: string[] = ['images/Cover1.png'];
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
        this.boundHandleKeydown = (e: KeyboardEvent) => this.handleKeydown(e);
        this.boundContextMenu = (e: Event) => e.preventDefault();

        this.boundTouchStart = () => {};
        this.boundTouchEnd = () => {};
        this.boundTouchMove = () => {};
        this.boundPinchTouchStart = () => {};
        this.boundPinchTouchMove = () => {};
        this.boundPanTouchStart = () => {};
        this.boundPanTouchMove = () => {};
        this.boundPanTouchEnd = () => {};
        this.boundPanTouchCancel = () => {};

        this.init();
    }

    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required element #${id} not found in DOM`);
        }
        return element;
    }

    private init(): void {
        this.totalPagesElement.textContent = this.config.pages.length.toString();
        this.setupEventListeners();
        this.preloadAllImages();
        this.updatePageIndicatorVisibility();
    }

    private preloadAllImages(): void {
        this.config.currentPage = 0;
        this.currentPageElement.textContent = '1';
        this.loadImageSequentially(0, OmegaViewer.INITIAL_IMAGES_TO_LOAD);
    }

    private loadImageSequentially(pageIndex: number, priorityCount: number): void {
        if (pageIndex >= this.config.pages.length) {
            return;
        }

        this.loadImageWithCallback(pageIndex, () => {
            if (pageIndex < priorityCount - 1) {
                this.loadImageSequentially(pageIndex + 1, priorityCount);
            } else if (pageIndex === priorityCount - 1) {
                this.loadRemainingImagesInBackground(priorityCount);
            } else {
                this.loadImageSequentially(pageIndex + 1, priorityCount);
            }
        });
    }

    private loadRemainingImagesInBackground(startIndex: number): void {
        if (startIndex < this.config.pages.length) {
            this.loadImageSequentially(startIndex, this.config.pages.length);
        }
    }

    private loadImageWithCallback(pageIndex: number, onComplete: () => void): void {
        if (this.loadedImages.has(pageIndex)) {
            onComplete();
            return;
        }

        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;

        const loadedImage: LoadedImage = {
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

        if (this.zoomLevel !== 1.0 || this.translateX !== 0 || this.translateY !== 0) {
            img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
            img.style.transformOrigin = '0 0';
        }
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (e.key === 'ArrowLeft') {
            this.previousPage();
        } else if (e.key === 'ArrowRight') {
            this.nextPage();
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('scroll', this.boundHandleScroll);
        document.addEventListener('keydown', this.boundHandleKeydown);

        this.navLeft.addEventListener('click', (e: MouseEvent) => {
            if (this.isClickInViewerArea(e)) {
                e.preventDefault();
                this.previousPage();
            }
        });
        this.navRight.addEventListener('click', (e: MouseEvent) => {
            if (this.isClickInViewerArea(e)) {
                e.preventDefault();
                this.nextPage();
            }
        });

        this.navLeft.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.previousPage();
            }
        });
        this.navRight.addEventListener('keydown', (e: KeyboardEvent) => {
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

    private setupTouchNavigation(): void {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchIdentifier: number | null = null;

        this.boundTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchIdentifier = e.touches[0].identifier;
            } else {
                touchIdentifier = null;
            }
        };

        this.boundTouchEnd = (e: TouchEvent) => {
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

    private handleSwipe(startX: number, endX: number, startY: number): void {
        const diff = startX - endX;

        if (!this.isTouchInViewerArea(startY)) {
            return;
        }

        if (Math.abs(diff) > OmegaViewer.SWIPE_THRESHOLD_PX) {
            if (diff > 0) {
                this.nextPage();
            } else {
                this.previousPage();
            }
        }
    }

    private setupPinchZoom(): void {
        let initialDistance = 0;
        let initialZoom = 1.0;
        let initialTranslateX = 0;
        let initialTranslateY = 0;
        let pinchCenterX = 0;
        let pinchCenterY = 0;
        let isPinching = false;

        const getDistance = (touch1: Touch, touch2: Touch): number => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getPinchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
            return {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        };

        this.boundPinchTouchStart = (e: TouchEvent) => {
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
            } else {
                isPinching = false;
            }
        };

        this.boundPinchTouchMove = (e: TouchEvent) => {
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

    private applyTransform(): void {
        for (const loadedImage of this.loadedImages.values()) {
            const img = loadedImage.element;
            img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
            img.style.transformOrigin = '0 0';
        }
    }

    private setupPanDrag(): void {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let initialTranslateX = 0;
        let initialTranslateY = 0;
        let dragTouchId: number | null = null;

        this.boundPanTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1 && this.zoomLevel > 1.0) {
                isDragging = true;
                dragTouchId = e.touches[0].identifier;
                dragStartX = e.touches[0].clientX;
                dragStartY = e.touches[0].clientY;
                initialTranslateX = this.translateX;
                initialTranslateY = this.translateY;
            } else {
                isDragging = false;
                dragTouchId = null;
            }
        };

        this.boundPanTouchMove = (e: TouchEvent) => {
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

    private isClickInViewerArea(e: MouseEvent): boolean {
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

    private isTouchInViewerArea(touchY: number): boolean {
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

    private handleScroll(): void {
        if (!this.isInfiniteScrollMode) return;

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

    public destroy(): void {
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

    private updatePageIndicatorVisibility(): void {
        if (!this.pageIndicator) return;

        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollBottom = scrollTop + viewportHeight;

        const headerHeight = this.header ? this.header.offsetHeight : 0;
        const footerTop = this.footer ? this.footer.offsetTop : document.documentElement.scrollHeight;

        const isInHeader = scrollBottom < headerHeight + viewportHeight * OmegaViewer.HEADER_VISIBILITY_THRESHOLD;
        const isInFooter = scrollTop > footerTop - viewportHeight * OmegaViewer.FOOTER_VISIBILITY_THRESHOLD;

        if (isInHeader || isInFooter) {
            this.pageIndicator.style.display = 'none';
        } else {
            this.pageIndicator.style.display = 'block';
        }
    }

    private checkAndLoadAdjacentImages(): void {
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

    private preloadImage(pageIndex: number): void {
        if (pageIndex < 0 || pageIndex >= this.config.pages.length) return;

        const img = new Image();
        img.src = this.config.pages[pageIndex];
    }

    private updateCurrentPageIndicator(): void {
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

    private preloadAdjacentImages(pageIndex: number): void {
        this.preloadImage(pageIndex + 1);
        this.preloadImage(pageIndex + 2);
        this.preloadImage(pageIndex - 1);
        this.preloadImage(pageIndex - 2);
    }

    private loadImageAtEnd(pageIndex: number): void {
        if (this.loadedImages.has(pageIndex)) return;

        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;

        const loadedImage: LoadedImage = {
            element: img,
            pageIndex: pageIndex
        };

        img.onload = () => {};

        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
            img.classList.add('omega-page-error');
            img.alt = `Failed to load page ${pageIndex + 1}`;
        };

        img.src = this.config.pages[pageIndex];
        this.pageContainer.appendChild(img);
        this.loadedImages.set(pageIndex, loadedImage);

        if (this.zoomLevel !== 1.0 || this.translateX !== 0 || this.translateY !== 0) {
            img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
            img.style.transformOrigin = '0 0';
        }
    }

    private loadImageAtStart(pageIndex: number): void {
        if (this.loadedImages.has(pageIndex)) return;

        const img = document.createElement('img');
        img.className = 'omega-page';
        img.dataset.pageIndex = pageIndex.toString();
        img.alt = `Screw the Omega Page ${pageIndex + 1}`;

        const loadedImage: LoadedImage = {
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

        if (this.zoomLevel !== 1.0 || this.translateX !== 0 || this.translateY !== 0) {
            img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
            img.style.transformOrigin = '0 0';
        }
    }

    private getFirstLoadedImage(): LoadedImage | null {
        let first: LoadedImage | null = null;
        for (const loadedImage of this.loadedImages.values()) {
            if (first === null || loadedImage.pageIndex < first.pageIndex) {
                first = loadedImage;
            }
        }
        return first;
    }

    private getLastLoadedImage(): LoadedImage | null {
        let last: LoadedImage | null = null;
        for (const loadedImage of this.loadedImages.values()) {
            if (last === null || loadedImage.pageIndex > last.pageIndex) {
                last = loadedImage;
            }
        }
        return last;
    }

    private nextPage(): void {
        if (this.config.currentPage < this.config.pages.length - 1) {
            const nextIndex = this.config.currentPage + 1;
            this.navigateToPage(nextIndex);
        }
    }

    private previousPage(): void {
        if (this.config.currentPage > 0) {
            const prevIndex = this.config.currentPage - 1;
            this.navigateToPage(prevIndex);
        }
    }

    private navigateToPage(pageIndex: number): void {
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

document.addEventListener('DOMContentLoaded', () => {
    new OmegaViewer();
});
