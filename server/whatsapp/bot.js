const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  authTimeoutMs: 60000,
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000
  }
});

let isReady = false;
let currentQR = null;

client.on('qr', (qr) => {
  currentQR = qr;
  console.log('\n\n======================================================');
  console.log('📱 WHATSAPP BOT LOGIN');
  console.log('Please scan the QR code below with your WhatsApp:');
  qrcode.generate(qr, { small: true });
  console.log('======================================================\n\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot is Ready!');
  isReady = true;
  currentQR = null;
});

client.on('auth_failure', msg => {
  console.error('WhatsApp Auth failure', msg);
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp Bot was disconnected', reason);
  isReady = false;
  currentQR = null;
});

if (process.env.WHATSAPP_ENABLED === 'true') {
  client.initialize();
}

/**
 * Send a WhatsApp message to a phone number.
 * @param {string} phone - e.g., '917700932311' or '7700932311'
 * @param {string} message 
 */
async function sendWhatsAppMessage(phone, message) {
  if (!isReady) {
    console.warn(`[WHATSAPP SKIPPED] Bot is not ready. Would have sent to ${phone}: ${message}`);
    return false;
  }
  try {
    // Format the number to what whatsapp-web.js expects: countrycode + number + @c.us
    // Assuming Indian numbers (91) by default if it's 10 digits
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    const chatId = `${formattedPhone}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`WhatsApp message sent to ${phone}`);
    return true;
  } catch (error) {
    console.error(`Error sending WhatsApp message to ${phone}:`, error);
    return false;
  }
}

/**
 * Send a WhatsApp PDF document to a phone number.
 * @param {string} phone 
 * @param {string} pdfPath - Absolute path to the PDF file
 * @param {string} caption 
 */
async function sendWhatsAppPDF(phone, pdfPath, caption) {
  if (!isReady) {
    console.warn(`[WHATSAPP SKIPPED] Bot is not ready. Would have sent PDF to ${phone}`);
    return false;
  }
  try {
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    const chatId = `${formattedPhone}@c.us`;
    const media = MessageMedia.fromFilePath(pdfPath);
    await client.sendMessage(chatId, media, { caption: caption });
    console.log(`WhatsApp PDF sent to ${phone}`);
    return true;
  } catch (error) {
    console.error(`Error sending WhatsApp PDF to ${phone}:`, error);
    return false;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppPDF,
  isReady: () => isReady,
  getQR: () => currentQR,
  logout: async () => {
    console.log("Attempting WhatsApp logout...");
    
    // Do not await this, as it can hang indefinitely if Puppeteer is detached
    if (isReady) {
      client.logout().catch(e => console.error("Error during client.logout()", e));
    }
    
    try {
      await client.destroy();
    } catch (e) {}

    isReady = false;
    currentQR = null;
    
    const fs = require('fs');
    const path = require('path');
    const authPath = path.join(__dirname, '../.wwebjs_auth');
    if (fs.existsSync(authPath)) {
      try {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log("Deleted .wwebjs_auth directory");
      } catch(e) {
        console.error("Failed to delete auth dir", e);
      }
    }

    console.log("Restarting server to apply clean WhatsApp state...");
    setTimeout(() => {
      process.exit(1); 
    }, 1000);
  }
};
