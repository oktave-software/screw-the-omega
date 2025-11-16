const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const tempDir = path.join(__dirname, 'temp');
  const screenshotPath = path.join(tempDir, 'landing-screenshot.png');

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
  console.log('Loading index.html...');
  await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for rendering

  // Take screenshot of header (initial view)
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to test/temp/landing-screenshot.png');

  // Scroll to chapter list and take another screenshot
  const chapterListPath = path.join(tempDir, 'landing-chapters.png');
  await page.evaluate(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: chapterListPath, fullPage: false });
  console.log('Chapter list screenshot saved to test/temp/landing-chapters.png');

  // Take full-page screenshot
  const fullPagePath = path.join(tempDir, 'landing-fullpage.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log('Full page screenshot saved to test/temp/landing-fullpage.png');

  await browser.close();
})();
