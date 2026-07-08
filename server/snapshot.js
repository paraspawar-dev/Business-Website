const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 800 });
  await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page1.screenshot({ path: '/home/paras/.gemini/antigravity/brain/26b173e7-6130-42f3-b726-2671e9839407/public_ui.png' });
  
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto('http://localhost:4000/dashboard.html', { waitUntil: 'networkidle2' });
  // Login first for admin
  try {
    await page2.evaluate(() => {
      localStorage.setItem('clink-admin-token', 'test-token');
      localStorage.setItem('clink-admin-user', JSON.stringify({username:'admin', role:'admin'}));
    });
    await page2.goto('http://localhost:4000/dashboard.html#content', { waitUntil: 'networkidle2' });
  } catch (e) {}
  
  await page2.screenshot({ path: '/home/paras/.gemini/antigravity/brain/26b173e7-6130-42f3-b726-2671e9839407/admin_ui.png' });

  await browser.close();
  console.log('Screenshots taken.');
})();
