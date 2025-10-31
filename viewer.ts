// Comic page configuration
interface OmegaConfig {
    pages: string[];
    currentPage: number;
}

class OmegaViewer {
    private config: OmegaConfig;
    private pageImage: HTMLImageElement;
    private currentPageElement: HTMLElement;
    private totalPagesElement: HTMLElement;
    private loadingElement: HTMLElement;
    private navLeft: HTMLElement;
    private navRight: HTMLElement;

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

        // Get DOM elements
        this.pageImage = document.getElementById('omega-page') as HTMLImageElement;
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
        this.loadPage(0);

        // Add event listeners
        this.setupEventListeners();

        // Preload adjacent pages
        this.preloadAdjacentPages();
    }

    private setupEventListeners(): void {
        // Keyboard navigation
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });

        // Click navigation
        this.navLeft.addEventListener('click', () => this.previousPage());
        this.navRight.addEventListener('click', () => this.nextPage());

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

        document.addEventListener('touchstart', (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e: TouchEvent) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        const handleSwipe = (): void => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

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

    private handleSwipe(): void {
        // This will be set by setupTouchNavigation
    }

    private loadPage(pageIndex: number): void {
        if (pageIndex < 0 || pageIndex >= this.config.pages.length) {
            return;
        }

        this.showLoading();
        this.config.currentPage = pageIndex;

        const img = new Image();
        img.onload = () => {
            this.pageImage.src = this.config.pages[pageIndex];
            this.currentPageElement.textContent = (pageIndex + 1).toString();
            this.hideLoading();
            this.preloadAdjacentPages();
        };

        img.onerror = () => {
            console.error(`Failed to load page ${pageIndex + 1}`);
            this.hideLoading();
            // Show error state
            this.pageImage.alt = `Failed to load page ${pageIndex + 1}`;
        };

        img.src = this.config.pages[pageIndex];
    }

    private preloadAdjacentPages(): void {
        // Preload next page
        if (this.config.currentPage + 1 < this.config.pages.length) {
            const nextImg = new Image();
            nextImg.src = this.config.pages[this.config.currentPage + 1];
        }

        // Preload previous page
        if (this.config.currentPage - 1 >= 0) {
            const prevImg = new Image();
            prevImg.src = this.config.pages[this.config.currentPage - 1];
        }
    }

    private nextPage(): void {
        if (this.config.currentPage < this.config.pages.length - 1) {
            this.loadPage(this.config.currentPage + 1);
        }
    }

    private previousPage(): void {
        if (this.config.currentPage > 0) {
            this.loadPage(this.config.currentPage - 1);
        }
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
