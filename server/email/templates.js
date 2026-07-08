// Base wrapper for all HTML emails
function wrapHtml(title, content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #0066FF, #00C2FF); color: #ffffff; padding: 30px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
      .content { padding: 30px 40px; }
      .footer { background: #0A1628; color: #94a3b8; padding: 20px; text-align: center; font-size: 13px; }
      .footer a { color: #00C2FF; text-decoration: none; }
      .btn { display: inline-block; padding: 12px 24px; background: #0066FF; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
      .ticket-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #0066FF; text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: left; }
      th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
      .total-row { font-weight: 700; font-size: 18px; color: #0f172a; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>OpenRepair Computer</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>OpenRepair Computer - IT Servicing & Solutions</p>
        <p>301, Raghuchandra Niwas, Balkum Pada No.2, Thane (W), 400608</p>
        <p><a href="tel:+917700932311">+91 7700932311</a> | <a href="mailto:caliberlink@outlook.com">caliberlink@outlook.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}

module.exports = {
  ticketConfirmation: (ticket) => {
    const content = `
      <p>Dear ${ticket.name},</p>
      <p>Thank you for reaching out to OpenRepair. We have successfully received your request for <strong>${ticket.service_type}</strong>.</p>
      <div class="ticket-box">Ticket ID: ${ticket.ticket_id}</div>
      <p><strong>Device:</strong> ${ticket.device || 'N/A'}<br>
      <strong>Description:</strong> ${ticket.description}</p>
      <p>Our technical team will review your request and contact you shortly on ${ticket.phone} to discuss the next steps.</p>
      <p>Best regards,<br><strong>OpenRepair Team</strong></p>
    `;
    return wrapHtml('Ticket Received', content);
  },

  internalNotification: (ticket) => {
    const content = `
      <h2>New Ticket Alert</h2>
      <div class="ticket-box">${ticket.ticket_id}</div>
      <table style="margin-top: 0;">
        <tr><td style="width: 120px;"><strong>Customer:</strong></td><td>${ticket.name}</td></tr>
        <tr><td><strong>Phone:</strong></td><td><a href="tel:${ticket.phone}">${ticket.phone}</a></td></tr>
        <tr><td><strong>Email:</strong></td><td>${ticket.email || 'N/A'}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${ticket.service_type}</td></tr>
        <tr><td><strong>Device:</strong></td><td>${ticket.device || 'N/A'}</td></tr>
        <tr><td><strong>Priority:</strong></td><td>${ticket.priority}</td></tr>
      </table>
      <p><strong>Description:</strong><br>${ticket.description}</p>
      <a href="http://localhost:4000/tickets/${ticket.ticket_id}" class="btn">View in Admin Panel</a>
    `;
    return wrapHtml(`New Ticket: ${ticket.ticket_id}`, content);
  },

  ticketUpdate: (ticket, message) => {
    const content = `
      <p>Dear ${ticket.name},</p>
      <p>There is an update regarding your ticket <strong>${ticket.ticket_id}</strong>:</p>
      <div style="background: #f1f5f9; padding: 20px; border-left: 4px solid #0066FF; margin: 20px 0; border-radius: 0 4px 4px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p><strong>Current Status:</strong> ${ticket.status}</p>
      <p>If you have any questions, you can reply directly to this email or call us.</p>
      <p>Best regards,<br><strong>OpenRepair Team</strong></p>
    `;
    return wrapHtml('Ticket Update', content);
  },

  ticketResolved: (ticket) => {
    const content = `
      <p>Dear ${ticket.name},</p>
      <p>Good news! Your ticket <strong>${ticket.ticket_id}</strong> has been marked as <strong>Resolved</strong>.</p>
      <div class="ticket-box">Status: Resolved</div>
      <p>Thank you for choosing OpenRepair for your IT needs. We hope you are satisfied with our service.</p>
      <p>If you face any further issues, please don't hesitate to reach out to us again.</p>
      <p>Best regards,<br><strong>OpenRepair Team</strong></p>
    `;
    return wrapHtml('Ticket Resolved', content);
  },

  salesInquiry: (ticket) => {
    const content = `
      <p>Dear ${ticket.name},</p>
      <p>Thank you for your interest in our products. We have received your inquiry (Ref: <strong>${ticket.ticket_id}</strong>).</p>
      <p>One of our sales executives will call you shortly to discuss availability, pricing, and configuration options that best suit your requirements.</p>
      <p>Best regards,<br><strong>OpenRepair Sales Team</strong></p>
    `;
    return wrapHtml('Sales Inquiry Received', content);
  },

  amcInquiry: (ticket) => {
    const content = `
      <p>Dear ${ticket.name},</p>
      <p>Thank you for considering OpenRepair for your IT maintenance needs. We have received your AMC inquiry (Ref: <strong>${ticket.ticket_id}</strong>).</p>
      <p>Our enterprise support team is reviewing your requirements and will contact you to schedule a free infrastructure assessment or discuss our plans in detail.</p>
      <p>Best regards,<br><strong>OpenRepair Enterprise Team</strong></p>
    `;
    return wrapHtml('AMC Inquiry Received', content);
  },

  invoice: (invoice, customer) => {
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    
    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: right;">${item.qty}</td>
          <td style="text-align: right;">₹${item.rate.toFixed(2)}</td>
          <td style="text-align: right;">₹${item.amount.toFixed(2)}</td>
        </tr>
      `;
    });

    const content = `
      <p>Dear ${customer.name},</p>
      <p>Please find below the invoice for services rendered by OpenRepair Computer.</p>
      <div class="ticket-box">Invoice: ${invoice.invoice_number}</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; border-bottom: none;">Subtotal:</td>
            <td style="text-align: right; border-bottom: none;">₹${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; border-bottom: none;">GST (${invoice.tax_percent}%):</td>
            <td style="text-align: right; border-bottom: none;">₹${invoice.tax_amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right;" class="total-row">Total:</td>
            <td style="text-align: right;" class="total-row">₹${invoice.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 30px;"><strong>Status:</strong> <span style="color: ${invoice.status === 'Paid' ? '#00C48C' : '#FF4757'}">${invoice.status}</span></p>
      <p>If you have any questions about this invoice, please reply to this email.</p>
    `;
    return wrapHtml(`Invoice ${invoice.invoice_number}`, content);
  }
};
