const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Navigate to the local HTML file (in parent directory)
  await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);

  // Wait for the image to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for image rendering

  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, 'temp', 'test-screenshot.png'), fullPage: false });

  console.log('Screenshot saved to test/temp/test-screenshot.png');

  await browser.close();
})();
