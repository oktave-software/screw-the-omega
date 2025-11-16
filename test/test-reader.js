const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Test the reader page with screenshots
 * @param {Object} options - Test options
 * @param {number} options.width - Viewport width
 * @param {number} options.height - Viewport height
 * @param {string} options.deviceType - Device type for filename prefix ('desktop' or 'mobile')
 */
async function testReaderPage(options = {}) {
  const {
    width = 1920,
    height = 1080,
    deviceType = 'desktop'
  } = options;

  const tempDir = path.join(__dirname, 'temp');
  const screenshotPath = path.join(tempDir, `reader-${deviceType}-screenshot.png`);

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height }
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
  console.log(`Screenshot saved to test/temp/reader-${deviceType}-screenshot.png`);

  // Scroll down to test infinite scroll
  console.log('Testing infinite scroll...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  const scrolledPageCounter = await page.evaluate(() => {
    return document.getElementById('page-counter')?.textContent;
  });
  console.log('After scrolling, page counter shows:', scrolledPageCounter);

  // Test right navigation (next page)
  console.log('\nTesting tap navigation...');
  const navRightExists = await page.evaluate(() => {
    return !!document.getElementById('nav-right');
  });
  console.log('Navigation zones present:', navRightExists);

  if (navRightExists) {
    // Click right zone to go to next page
    await page.click('#nav-right');
    await page.waitForTimeout(1000); // Wait for smooth scroll

    const afterNextClick = await page.evaluate(() => {
      return document.getElementById('page-counter')?.textContent;
    });
    console.log('After clicking right zone:', afterNextClick);

    // Click left zone to go back
    await page.click('#nav-left');
    await page.waitForTimeout(1000);

    const afterPrevClick = await page.evaluate(() => {
      return document.getElementById('page-counter')?.textContent;
    });
    console.log('After clicking left zone:', afterPrevClick);
  }

  await browser.close();
}

// Run if called directly from CLI
if (require.main === module) {
  const deviceType = process.argv[2] || 'desktop';

  const configs = {
    desktop: { width: 1920, height: 1080, deviceType: 'desktop' },
    mobile: { width: 375, height: 667, deviceType: 'mobile' }
  };

  const config = configs[deviceType] || configs.desktop;
  testReaderPage(config);
}

module.exports = { testReaderPage };
