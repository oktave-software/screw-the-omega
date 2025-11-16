const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const tempDir = path.join(__dirname, 'temp');
  const screenshotPath = path.join(tempDir, 'reader-screenshot.png');

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Navigate to the reader.html page via localhost
  console.log('Navigating to http://localhost:8000/reader.html...');
  await page.goto('http://localhost:8000/reader.html');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  console.log('Page loaded, waiting for comic to load...');

  // Wait for loading indicator to disappear (comic has loaded)
  try {
    await page.waitForSelector('#loading-indicator.hidden', { timeout: 10000 });
    console.log('Comic loaded successfully!');
  } catch (e) {
    console.log('Warning: Loading indicator did not disappear within 10 seconds');
  }

  // Check reader status
  const readerStatus = await page.evaluate(() => {
    const container = document.getElementById('comic-container');
    const images = container ? container.querySelectorAll('.comic-page') : [];
    const pageCounter = document.getElementById('page-counter');
    const header = document.getElementById('reader-header');

    return {
      containerPresent: !!container,
      imageCount: images.length,
      pageCounterText: pageCounter ? pageCounter.textContent : null,
      pageCounterVisible: pageCounter ? pageCounter.style.display !== 'none' : false,
      headerPresent: !!header,
      firstImageLoaded: images.length > 0 ? images[0].complete : false
    };
  });
  console.log('Reader status:', readerStatus);

  // Wait a bit for first images to render
  await page.waitForTimeout(2000);

  // Take screenshot of the reader with first page visible
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to test/temp/reader-screenshot.png');

  // Scroll down to test infinite scroll
  console.log('Testing infinite scroll...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  const scrolledPageCounter = await page.evaluate(() => {
    return document.getElementById('page-counter')?.textContent;
  });
  console.log('After scrolling, page counter shows:', scrolledPageCounter);

  await browser.close();
})();
