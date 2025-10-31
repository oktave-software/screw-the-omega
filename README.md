# Screw the Omega - Comic Viewer

A responsive comic viewer built with TypeScript, HTML, and CSS.

## Features

- **Keyboard Navigation**: Use left/right arrow keys to navigate between pages
- **Click Navigation**: Click on the left/right side of the page to navigate
- **Touch/Swipe Support**: Swipe left/right on mobile devices
- **Responsive Design**: Works on both desktop and mobile devices
- **Page Preloading**: Adjacent pages are preloaded for smooth navigation
- **Page Indicator**: Shows current page and total pages

## Setup Instructions

### 1. Add Your Comic Pages

1. Download all comic pages from the Google Drive folder
2. Place them in the `images/` folder
3. Name them sequentially (e.g., `page1.jpg`, `page2.jpg`, etc.)

### 2. Update the Page List

Edit `viewer.ts` and update the `pages` array with your comic page filenames:

```typescript
this.config = {
    pages: [
        'images/page1.jpg',
        'images/page2.jpg',
        'images/page3.jpg',
        // Add all your comic pages here
    ],
    currentPage: 0
};
```

### 3. Recompile TypeScript

After updating the page list, recompile the TypeScript:

```bash
npm run build
```

Or for automatic recompilation on changes:

```bash
npm run watch
```

### 4. Open the Viewer

Open `index.html` in your web browser to view the comic.

## Usage

- **Desktop**:
  - Click left/right side of the page to navigate
  - Use arrow keys (← →) to navigate
  - Hover to see navigation arrows

- **Mobile**:
  - Tap left/right side of the screen to navigate
  - Swipe left/right to navigate
  - Navigation arrows are always visible with reduced opacity

## File Structure

```
screw-the-omega/
├── index.html          # Main HTML file
├── styles.css          # Responsive CSS styles
├── viewer.ts           # TypeScript source code
├── viewer.js           # Compiled JavaScript (auto-generated)
├── images/             # Comic pages directory
│   ├── page1.jpg
│   ├── page2.jpg
│   └── ...
├── package.json        # NPM configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Development

To make changes to the viewer:

1. Edit `viewer.ts` for logic changes
2. Edit `styles.css` for styling changes
3. Edit `index.html` for structure changes
4. Run `npm run build` to recompile TypeScript

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)
