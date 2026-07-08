const nodemailer = require('nodemailer');

async function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
    return null; // Email not configured
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
}

// Main send function
async function sendEmail(to, subject, html, attachments = []) {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.warn(`[EMAIL SKIPPED] Not configured. Would have sent to ${to}: ${subject}`);
      return true;
    }

    const mailOptions = {
      from: `"OpenRepair" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Specific email functions (using templates)
const templates = require('./templates');

async function sendTicketConfirmation(ticket) {
  const html = templates.ticketConfirmation(ticket);
  return sendEmail(ticket.email, `We have received your repair request (Ticket: ${ticket.ticket_id}) - OpenRepair`, html);
}

async function sendInternalNotification(ticket) {
  const html = templates.internalNotification(ticket);
  return sendEmail(process.env.EMAIL_FROM, `[NEW TICKET] ${ticket.ticket_id} - ${ticket.service_type}`, html);
}

async function sendTicketUpdate(ticket, responseMsg) {
  const html = templates.ticketUpdate(ticket, responseMsg);
  return sendEmail(ticket.email, `Update on your ticket ${ticket.ticket_id} - OpenRepair`, html);
}

async function sendTicketResolved(ticket) {
  const html = templates.ticketResolved(ticket);
  return sendEmail(ticket.email, `Your ticket ${ticket.ticket_id} is resolved! - OpenRepair`, html);
}

async function sendSalesInquiry(ticket) {
  const html = templates.salesInquiry(ticket);
  return sendEmail(ticket.email, `Information regarding your inquiry - OpenRepair`, html);
}

async function sendAmcInquiry(ticket) {
  const html = templates.amcInquiry(ticket);
  return sendEmail(ticket.email, `Information about OpenRepair AMC Plans`, html);
}

async function sendInvoice(invoice, customer, pdfPath) {
  const html = templates.invoice(invoice, customer);
  const attachments = [];
  if (pdfPath) {
    attachments.push({
      filename: `Invoice_${invoice.invoice_number}.pdf`,
      path: pdfPath
    });
  }
  return sendEmail(customer.email, `Invoice ${invoice.invoice_number} from OpenRepair Computer`, html, attachments);
}

module.exports = {
  sendEmail,
  sendTicketConfirmation,
  sendInternalNotification,
  sendTicketUpdate,
  sendTicketResolved,
  sendSalesInquiry,
  sendAmcInquiry,
  sendInvoice
};
