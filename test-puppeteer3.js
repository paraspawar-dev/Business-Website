const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const express = require('express');
  const app = express();
  app.use(express.static(__dirname));
  const server = app.listen(0, async () => {
    const port = server.address().port;
    
    try {
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      
      await page.goto(`http://localhost:${port}/index.html`);
      await new Promise(r => setTimeout(r, 1000));
      
      const btn = await page.$('.btn-cta');
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        
        // Fill form
        await page.type('input[name="name"]', 'Test User');
        await page.type('input[name="phone"]', '1234567890');
        await page.select('select[name="type"]', 'Repair');
        await page.type('textarea[name="description"]', 'Test desc');
        
        // Click submit
        const submitBtn = await page.$('#ticket-form button[type="submit"]');
        if (submitBtn) {
          console.log("Submitting form...");
          await submitBtn.click();
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.log("Submit button not found");
        }
      }
    } catch (e) {
      console.log('Error during puppeteer execution:', e);
    }
    
    server.close();
    await browser.close();
  });
})();
