const puppeteer = require('puppeteer');
const getInvoiceHtml = require('./invoiceTemplate');

async function generateInvoicePDF(invoice, customer, outputPath) {
  let browser = null;
  try {
    // We need the payments to show balance due on the PDF.
    // However, the current signature `generateInvoicePDF(invoice, customer, outputPath)`
    // doesn't have payments. We should fetch them here.
    const DB = require('../db/database');
    const payments = DB.all('SELECT * FROM payments WHERE invoice_id = ?', [invoice.id]);

    const htmlContent = getInvoiceHtml(invoice, customer, payments);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for web fonts to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return outputPath;
  } catch (error) {
    console.error('Puppeteer Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateInvoicePDF
};
