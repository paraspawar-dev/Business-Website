const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Need to start a local server to serve the files
  const express = require('express');
  const app = express();
  app.use(express.static(__dirname));
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Server running on port ${port}`);
    
    try {
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      
      await page.goto(`http://localhost:${port}/index.html`);
      
      await new Promise(r => setTimeout(r, 1000));
      
      const btn = await page.$('.btn-cta');
      if (btn) {
        console.log('Button found, clicking...');
        await btn.click();
        
        await new Promise(r => setTimeout(r, 500));
        
        const isModalOpen = await page.evaluate(() => {
          const modal = document.getElementById('ticket-modal');
          return modal && modal.classList.contains('open');
        });
        
        console.log('Is Modal Open?', isModalOpen);
      } else {
        console.log('Button not found');
      }
    } catch (e) {
      console.log('Error during puppeteer execution:', e);
    }
    
    server.close();
    await browser.close();
  });
})();
