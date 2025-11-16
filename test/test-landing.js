const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Test the landing page with screenshots
 * @param {Object} options - Test options
 * @param {number} options.width - Viewport width
 * @param {number} options.height - Viewport height
 * @param {string} options.deviceType - Device type for filename prefix ('desktop' or 'mobile')
 */
async function testLandingPage(options = {}) {
  const {
    width = 1920,
    height = 1080,
    deviceType = 'desktop'
  } = options;

  const tempDir = path.join(__dirname, 'temp');
  const screenshotPath = path.join(tempDir, `landing-${deviceType}-screenshot.png`);

  // Delete previous screenshots for this device type
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.startsWith(`landing-${deviceType}-`) && file.endsWith('.png')) {
        fs.unlinkSync(path.join(tempDir, file));
        console.log(`Deleted previous screenshot: ${file}`);
      }
    }
  } else {
    // Create temp directory if it doesn't exist
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height }
  });
  const page = await context.newPage();

  // Navigate to the local HTML file (in parent directory)
  console.log('Loading index.html...');
  await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for rendering

  // Take screenshot of header (initial view)
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved to test/temp/landing-${deviceType}-screenshot.png`);

  // Scroll to chapter list and take another screenshot
  const chapterListPath = path.join(tempDir, `landing-${deviceType}-chapters.png`);
  await page.evaluate(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: chapterListPath, fullPage: false });
  console.log(`Chapter list screenshot saved to test/temp/landing-${deviceType}-chapters.png`);

  // Take full-page screenshot
  const fullPagePath = path.join(tempDir, `landing-${deviceType}-fullpage.png`);
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log(`Full page screenshot saved to test/temp/landing-${deviceType}-fullpage.png`);

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
  testLandingPage(config);
}

module.exports = { testLandingPage };
