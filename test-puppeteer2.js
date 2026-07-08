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
      await page.goto(`http://localhost:${port}/index.html`);
      await new Promise(r => setTimeout(r, 1000));
      
      const navBtn = await page.$('.navbar .btn-primary');
      if (navBtn) {
        console.log('Nav Button found, clicking...');
        await navBtn.click();
        
        await new Promise(r => setTimeout(r, 500));
        
        const isModalOpen = await page.evaluate(() => {
          const modal = document.getElementById('ticket-modal');
          return modal && modal.classList.contains('open');
        });
        
        console.log('Is Modal Open from Nav?', isModalOpen);
      } else {
        console.log('Nav Button not found');
      }
    } catch (e) {
      console.log('Error during puppeteer execution:', e);
    }
    
    server.close();
    await browser.close();
  });
})();
