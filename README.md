# Screw the Omega - Comic Viewer

A responsive webcomic viewer for "Screw the Omega" by Nine0uh, built with TypeScript, HTML, and CSS. This viewer displays 35 comic pages (Cover + Pages 1-34) with an optimized reading experience for both desktop and mobile devices.

## Features

- **Multiple Navigation Methods**:
  - Keyboard: Left/right arrow keys
  - Mouse: Click left/right third of screen, or use accessible navigation buttons
  - Touch: Swipe left/right on mobile devices
- **Pinch-to-Zoom**: Industry-standard pinch-to-zoom with pan/drag support when zoomed
- **Infinite Scroll**: Seamlessly scroll through all pages with dynamic loading
- **Responsive Design**: Optimized layouts for portrait/landscape and mobile/desktop
- **Smart Loading**: First 5 pages load immediately, remaining pages load in background
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support, focus indicators
- **Page Indicator**: Fixed position indicator shows current page and total pages

## Development

### Prerequisites

```bash
npm install
```

### Build Commands

```bash
# Compile TypeScript to JavaScript
npm run build

# Watch mode - automatically recompile on changes
npm run watch

# Run screenshot test
node test/screenshot.js
```

### Modifying Comic Pages

To add or remove pages:

1. Place PNG files in `images/` directory following the naming convention: `Cover1.png`, `Pg1.png`, `Pg2.png`, etc.
2. Update the page count in `viewer.ts` constructor (around line 41): change the loop limit from `34` to your desired count
3. Run `npm run build` to recompile

Pages are programmatically generated, so you only need to change one number to add/remove pages.

## Architecture

Built with a single-class architecture (`OmegaViewer`) that manages:
- Image loading with priority queue (first 5 images load immediately)
- Infinite scroll with dynamic page tracking
- Industry-standard pinch-to-zoom with translate + scale transforms
- Touch gesture detection (swipe, pinch, pan/drag)
- Navigation boundary validation
- Memory leak prevention with proper cleanup

See `CLAUDE.md` for detailed implementation documentation.

## File Structure

```
screw-the-omega/
├── index.html          # Main HTML with semantic markup and ARIA labels
├── styles.css          # Responsive CSS with mobile-first design
├── viewer.ts           # TypeScript source code
├── images/             # Comic pages (Cover1.png, Pg1-34.png)
├── test/               # Screenshot testing with Playwright
├── package.json        # NPM configuration
├── tsconfig.json       # TypeScript configuration (ES2020, strict mode)
├── CLAUDE.md           # Detailed implementation documentation
└── README.md           # This file
```

**Note:** `viewer.js` is auto-generated from `viewer.ts` but **must be committed** to version control because this project deploys via GitHub Pages (no server-side build step).

## Browser Compatibility

- Modern browsers: Chrome, Firefox, Safari, Edge
- Mobile browsers: iOS Safari, Chrome Mobile, Samsung Internet
- Requires ES2020 support

## Credits

**Screw the Omega** is an independent webcomic by [Nine0uh](https://www.instagram.com/nine0uh/)

- Follow on [Instagram](https://www.instagram.com/nine0uh/)
- Support on [Patreon](https://www.patreon.com/Nine0uh)
