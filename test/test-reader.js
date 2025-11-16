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
  console.log('Page loaded, waiting 3 seconds for iframe to load...');
  await page.waitForTimeout(3000);

  // Check if iframe is present
  const iframePresent = await page.evaluate(() => {
    const iframe = document.getElementById('comic-reader');
    return iframe ? {
      present: true,
      src: iframe.src,
      loaded: iframe.contentDocument !== null
    } : { present: false };
  });
  console.log('Iframe status:', iframePresent);

  // Get the constructed URL
  const constructedUrl = await page.evaluate(() => {
    const baseUrl = window.location.origin + window.location.pathname.replace('/reader.html', '');
    const cbzUrl = baseUrl + '/chapter1.cbz';
    const kthoomUrl = `https://codedread.github.io/kthoom/index.html?bookUri=${encodeURIComponent(cbzUrl)}&preventUserOpeningBooks=true&doNotPromptOnClose=true`;
    return { baseUrl, cbzUrl, kthoomUrl };
  });
  console.log('Constructed URLs:', constructedUrl);

  // Take screenshot
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to test/temp/reader-screenshot.png');

  await browser.close();
})();
