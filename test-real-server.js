const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  console.log("Starting backend server...");
  const backend = spawn('npm', ['run', 'dev'], { cwd: 'server' });
  
  backend.stdout.on('data', data => console.log(`BACKEND: ${data}`));
  backend.stderr.on('data', data => console.error(`BACKEND ERROR: ${data}`));
  
  // wait for server to start
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto(`http://localhost:3000/index.html`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Clicking Raise Ticket button...");
    const btn = await page.$('.btn-cta');
    if (btn) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      
      const isModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('ticket-modal');
        return modal && modal.classList.contains('open');
      });
      console.log("Is Modal Open?", isModalOpen);
      
      if (isModalOpen) {
        console.log("Filling form...");
        await page.type('input[name="name"]', 'Puppeteer User');
        await page.type('input[name="phone"]', '1234567890');
        await page.select('select[name="type"]', 'Repair');
        await page.type('textarea[name="description"]', 'Puppeteer Test');
        
        console.log("Submitting form...");
        await page.click('#ticket-form button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));
        
        const success = await page.evaluate(() => {
          const el = document.getElementById('ticket-success');
          return el ? el.style.display === 'block' : false;
        });
        console.log("Did form submit successfully?", success);
      }
    } else {
      console.log("Button .btn-cta not found");
    }
  } catch (e) {
    console.log('Error during puppeteer execution:', e);
  }
  
  await browser.close();
  backend.kill();
  process.exit(0);
})();
