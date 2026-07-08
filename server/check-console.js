const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page1 = await browser.newPage();
  page1.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page1.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('Public site loaded.');

  const page2 = await browser.newPage();
  page2.on('console', msg => console.log('ADMIN LOG:', msg.type(), msg.text()));
  page2.on('pageerror', err => console.log('ADMIN ERROR:', err.message));
  
  await page2.goto('http://localhost:4000/dashboard.html', { waitUntil: 'networkidle2' });
  console.log('Admin site loaded.');

  await browser.close();
})();
