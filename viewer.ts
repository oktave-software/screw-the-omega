// Comic page configuration
interface OmegaConfig {
    pages: string[];
    currentPage: number;
}

interface LoadedImage {
    element: HTMLImageElement;
    pageIndex: number;
}

class OmegaViewer {
    private config: OmegaConfig;
    private pageContainer: HTMLElement;
    private currentPageElement: HTMLElement;
    private totalPagesElement: HTMLElement;
    private loadingElement: HTMLElement;
    private navLeft: HTMLElement;
    private navRight: HTMLElement;
    private loadedImages: Map<number, LoadedImage>;
    private isInfiniteScrollMode: boolean;
    private scrollTimeout: number | null;

    constructor() {
        // Initialize page configuration
        this.config = {
            pages: [
                'images/Cover1.png',
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
        this.pageContainer = document.getElementById('page-container') as HTMLElement;
        this.currentPageElement = document.getElementById('current-page') as HTMLElement;
        this.totalPagesElement = document.getElementById('total-pages') as HTMLElement;
        this.loadingElement = document.getElementById('loading') as HTMLElement;
        this.navLeft = document.getElementById('nav-left') as HTMLElement;
        this.navRight = document.getElementById('nav-right') as HTMLElement;

        this.init();
    }

    private init(): void {
        // Set total pages
        this.totalPagesElement.textContent = this.config.pages.length.toString();

        // Load first page
        this.loadInitialPage(0);

        // Add event listeners
        this.setupEventListeners();

        // Preload all images (cover first, then all others)
        this.preloadAllImages();

        // Set initial page indicator visibility (hide on header)
        this.updatePageIndicatorVisibility();
    }

    private preloadAllImages(): void {
        // Preload cover first (index 0)
        this.preloadImage(0);

        // Then preload all remaining images in sequence
        for (let i = 1; i < this.config.pages.length; i++) {
            this.preloadImage(i);
        }
    }

    private setupEventListeners(): void {
        // Scroll event for infinite scrolling
        window.addEventListener('scroll', () => this.handleScroll());

        // Keyboard navigation
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });

        // Click navigation - only navigate if clicking within viewer bounds
        this.navLeft.addEventListener('click', (e: MouseEvent) => {
            if (this.isClickInViewerArea(e)) {
                this.previousPage();
            }
        });
        this.navRight.addEventListener('click', (e: MouseEvent) => {
            if (this.isClickInViewerArea(e)) {
                this.nextPage();
            }
        });

        // Touch swipe navigation
        this.setupTouchNavigation();

        // Prevent context menu on long press (mobile)
        document.addEventListener('contextmenu', (e: Event) => {
            e.preventDefault();
        });
    }

    private setupTouchNavigation(): void {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e: TouchEvent) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartY);
        });

        const handleSwipe = (startY: number): void => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            // Check if touch was within viewer bounds
            if (!this.isTouchInViewerArea(startY)) {
                return;
            }

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swiped left - next page
                    this.nextPage();
                } else {
                    // Swiped right - previous page
                    this.previousPage();
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    private handleSwipe(startY: number): void {
        // This will be set by setupTouchNavigation
    }

    private isClickInViewerArea(e: MouseEvent): boolean {
        const header = document.getElementById('header');
        const footer = document.getElementById('footer');
        const viewer = document.getElementById('omega-viewer');

        if (!viewer) return false;

        const viewerRect = viewer.getBoundingClientRect();
        const headerRect = header ? header.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        // Check if click Y position is within viewer bounds
        const clickY = e.clientY;

        // Prevent navigation if in header
        if (headerRect && clickY < headerRect.bottom) {
            return false;
        }

        // Prevent navigation if in footer
        if (footerRect && clickY > footerRect.top) {
            return false;
        }

        return true;
    }

    private isTouchInViewerArea(touchY: number): boolean {
        const header = document.getElementById('header');
        const footer = document.getElementById('footer');
        const viewer = document.getElementById('omega-viewer');

        if (!viewer) return false;

        const viewerRect = viewer.getBoundingClientRect();
        const headerRect = header ? header.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        const scrollY = window.scrollY;
        const absoluteTouchY = touchY + scrollY;
        const headerHeight = header ? header.offsetHeight : 0;
        const footerTop = footer ? footer.offsetTop : document.documentElement.scrollHeight;

        // Check if touch is in viewer area (not in header or footer)
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

        // Debounce scroll event
        if (this.scrollTimeout !== null) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = window.setTimeout(() => {
            this.checkAndLoadAdjacentImages();
            this.updateCurrentPageIndicator();
            this.updatePageIndicatorVisibility();
        }, 100);
    }

    private updatePageIndicatorVisibility(): void {
        const header = document.getElementById('header');
        const footer = document.getElementById('footer');
        const pageIndicator = document.getElementById('page-indicator');

        if (!pageIndicator) return;

        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollBottom = scrollTop + viewportHeight;

        const headerHeight = header ? header.offsetHeight : 0;
        const footerTop = footer ? footer.offsetTop : document.documentElement.scrollHeight;

        // Check if we're viewing the comic (not header or footer)
        const isInHeader = scrollBottom < headerHeight + viewportHeight * 0.3;
        const isInFooter = scrollTop > footerTop - viewportHeight * 0.7;

        if (isInHeader || isInFooter) {
            pageIndicator.style.display = 'none';
        } else {
            pageIndicator.style.display = 'block';
        }
    }

    private checkAndLoadAdjacentImages(): void {
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

    private preloadImage(pageIndex: number): void {
        if (pageIndex < 0 || pageIndex >= this.config.pages.length) return;

        // Just preload into cache, don't add to DOM
        const img = new Image();
        img.src = this.config.pages[pageIndex];
    }

    private updateCurrentPageIndicator(): void {
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

    private preloadAdjacentImages(pageIndex: number): void {
        // Preload next 2 images
        this.preloadImage(pageIndex + 1);
        this.preloadImage(pageIndex + 2);
        // Preload previous 2 images
        this.preloadImage(pageIndex - 1);
        this.preloadImage(pageIndex - 2);
    }

    private loadInitialPage(pageIndex: number): void {
        this.config.currentPage = pageIndex;
        this.currentPageElement.textContent = (pageIndex + 1).toString();
        this.loadImageAtEnd(pageIndex);
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

    private getFirstLoadedImage(): LoadedImage | null {
        let first: LoadedImage | null = null;
        for (const [_, loadedImage] of this.loadedImages) {
            if (first === null || loadedImage.pageIndex < first.pageIndex) {
                first = loadedImage;
            }
        }
        return first;
    }

    private getLastLoadedImage(): LoadedImage | null {
        let last: LoadedImage | null = null;
        for (const [_, loadedImage] of this.loadedImages) {
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

        // Update page indicator visibility
        this.updatePageIndicatorVisibility();

        // Re-enable infinite scroll after a short delay
        setTimeout(() => {
            this.isInfiniteScrollMode = true;
        }, 500);
    }

    private showLoading(): void {
        this.loadingElement.classList.add('active');
    }

    private hideLoading(): void {
        this.loadingElement.classList.remove('active');
    }
}

// Initialize the viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OmegaViewer();
});
