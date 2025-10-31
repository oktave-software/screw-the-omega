const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const tempDir = path.join(__dirname, 'temp');
  const screenshotPath = path.join(tempDir, 'test-screenshot.png');

  // Delete previous screenshots
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
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
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Navigate to the local HTML file (in parent directory)
  await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);

  // Wait for the image to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for image rendering

  // Take screenshot
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log('Screenshot saved to test/temp/test-screenshot.png');

  await browser.close();
})();
