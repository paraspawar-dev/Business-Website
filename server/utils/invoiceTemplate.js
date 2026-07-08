module.exports = function getInvoiceHtml(invoice, customer, payments) {
  const isEstimate = invoice.status === 'Estimate';
  const documentTitle = isEstimate ? 'ESTIMATE' : (invoice.status === 'Paid' ? 'RECEIPT' : 'INVOICE');
  
  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
  
  // Format dates
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'On Receipt';
  
  // Determine if there are payments
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = invoice.total - totalPaid;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} - ${invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #334155;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    
    .invoice-box {
      max-width: 800px;
      margin: auto;
      padding: 40px;
      box-sizing: border-box;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    
    .brand {
      color: #0f172a;
    }
    
    .brand h1 {
      margin: 0 0 5px 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .brand p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .title-section {
      text-align: right;
    }
    
    .title-section h2 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -1px;
      text-transform: uppercase;
    }
    
    .title-section .meta {
      font-size: 13px;
      color: #64748b;
    }
    
    .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-bottom: 4px;
    }
    
    .meta-label {
      font-weight: 500;
      color: #94a3b8;
    }
    
    .meta-value {
      font-weight: 600;
      color: #0f172a;
      min-width: 100px;
    }
    
    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .bill-to h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin: 0 0 10px 0;
    }
    
    .bill-to p {
      margin: 0 0 4px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .bill-to .customer-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 16px;
      margin-bottom: 6px;
    }
    
    table {
      width: 100%;
      line-height: inherit;
      text-align: left;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    table th {
      padding: 12px 15px;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #334155;
    }
    
    table th.right, table td.right {
      text-align: right;
    }
    
    table th.center, table td.center {
      text-align: center;
    }
    
    .item-desc {
      font-weight: 500;
      color: #0f172a;
    }
    
    .totals-container {
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-table {
      width: 350px;
      margin-bottom: 0;
    }
    
    .totals-table td {
      padding: 10px 15px;
      border: none;
    }
    
    .totals-table tr.border-top td {
      border-top: 1px solid #e2e8f0;
    }
    
    .totals-table .total-row td {
      border-top: 2px solid #0f172a;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      padding-top: 15px;
    }
    
    .totals-table .balance-row td {
      font-size: 16px;
      font-weight: 700;
      color: ${balanceDue > 0 ? '#ef4444' : '#10b981'};
    }
    
    .notes-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .notes-section h4 {
      margin: 0 0 5px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }
    
    .notes-section p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    
    /* Status Stamp */
    .stamp {
      position: absolute;
      top: 300px;
      right: 50px;
      font-size: 40px;
      font-weight: 800;
      text-transform: uppercase;
      border: 4px solid;
      padding: 10px 20px;
      border-radius: 10px;
      transform: rotate(-15deg);
      opacity: 0.15;
      z-index: -1;
      pointer-events: none;
    }
    
    .stamp.paid {
      color: #10b981;
      border-color: #10b981;
    }
    
  </style>
</head>
<body>
  <div class="invoice-box">
    
    ${invoice.status === 'Paid' ? '<div class="stamp paid">PAID</div>' : ''}
    
    <div class="header">
      <div class="brand">
        <h1>OpenRepair Computer</h1>
        <p>IT Servicing & Solutions<br>
        301, Raghuchandra Niwas, Balkum Pada No.2<br>
        Thane (W), 400608<br>
        +91 7700932311 | caliberlink@outlook.com</p>
      </div>
      
      <div class="title-section">
        <h2>${documentTitle}</h2>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">${isEstimate ? 'Estimate No:' : 'Invoice No:'}</span>
            <span class="meta-value">${invoice.invoice_number}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${invoiceDate}</span>
          </div>
          ${!isEstimate ? `
          <div class="meta-row">
            <span class="meta-label">Due Date:</span>
            <span class="meta-value">${dueDate}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div class="billing-section">
      <div class="bill-to">
        <h3>Billed To</h3>
        <div class="customer-name">${customer.name}</div>
        <p>${customer.phone}</p>
        ${customer.email ? `<p>${customer.email}</p>` : ''}
      </div>
      ${invoice.ticket_id ? `
      <div class="bill-to" style="text-align: right;">
        <h3>Reference</h3>
        <p>Ticket: <strong>${invoice.ticket_id}</strong></p>
      </div>
      ` : ''}
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="center" style="width: 10%">Qty</th>
          <th class="right" style="width: 20%">Rate</th>
          <th class="right" style="width: 20%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
        <tr>
          <td>
            <div class="item-desc">${item.description}</div>
          </td>
          <td class="center">${item.qty}</td>
          <td class="right">₹${item.rate.toFixed(2)}</td>
          <td class="right">₹${item.amount.toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals-container">
      <table class="totals-table">
        <tr>
          <td class="right meta-label">Subtotal</td>
          <td class="right meta-value">₹${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="right meta-label">GST (${invoice.tax_percent}%)</td>
          <td class="right meta-value">₹${invoice.tax_amount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td class="right">Total</td>
          <td class="right">₹${invoice.total.toFixed(2)}</td>
        </tr>
        
        ${(!isEstimate && payments.length > 0) ? `
        <tr class="border-top">
          <td class="right meta-label">Amount Paid</td>
          <td class="right meta-value" style="color: #10b981;">- ₹${totalPaid.toFixed(2)}</td>
        </tr>
        <tr class="balance-row">
          <td class="right">Balance Due</td>
          <td class="right">₹${balanceDue.toFixed(2)}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${invoice.notes ? `
    <div class="notes-section">
      <h4>Notes / Terms</h4>
      <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    <div class="footer">
      Thank you for your business.
    </div>
    
  </div>
</body>
</html>
  `;
  
  return html;
};
