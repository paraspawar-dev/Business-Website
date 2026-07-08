const express = require('express');
const DB = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../assets/products'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// TICKETS
router.get('/tickets', (req, res) => {
  try {
    const { status, priority, search, trash, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM tickets WHERE is_deleted = ?';
    const params = [trash === 'true' ? 1 : 0];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (search) { 
      query += ' AND (ticket_id LIKE ? OR name LIKE ? OR phone LIKE ?)'; 
      const searchStr = `%${search}%`;
      params.push(searchStr, searchStr, searchStr); 
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const tickets = DB.all(query, params);
    const totalRow = DB.get('SELECT COUNT(*) as count FROM tickets WHERE is_deleted = ?', [trash === 'true' ? 1 : 0]);
    
    res.json({ success: true, data: { tickets, total: totalRow.count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/dashboard/stats', (req, res) => {
  try {
    const stats = {
      tickets: {
        new: DB.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'New' AND is_deleted = 0")?.c || 0,
        open: DB.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'Open' AND is_deleted = 0")?.c || 0,
        in_progress: DB.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'In Progress' AND is_deleted = 0")?.c || 0,
        resolved_today: DB.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'Resolved' AND is_deleted = 0 AND date(updated_at) = date('now')")?.c || 0,
        new_today: DB.get("SELECT COUNT(*) as c FROM tickets WHERE status = 'New' AND is_deleted = 0 AND date(created_at) = date('now')")?.c || 0,
        total: DB.get("SELECT COUNT(*) as c FROM tickets WHERE is_deleted = 0")?.c || 0
      },
      invoices: {
        unpaid_amount: DB.get("SELECT SUM(total) as s FROM invoices WHERE status != 'Paid'")?.s || 0,
        paid_amount: DB.get("SELECT SUM(total) as s FROM invoices WHERE status = 'Paid'")?.s || 0,
        count: DB.get("SELECT COUNT(*) as c FROM invoices")?.c || 0
      },
      revenue: {
        today: DB.get("SELECT SUM(amount) as s FROM payments WHERE date(paid_at) = date('now')")?.s || 0,
        this_month: DB.get("SELECT SUM(amount) as s FROM payments WHERE strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')")?.s || 0
      }
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/tickets/:id', (req, res) => {
  try {
    const ticket = DB.get('SELECT * FROM tickets WHERE ticket_id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    
    const responses = DB.all('SELECT * FROM ticket_responses WHERE ticket_id = ? ORDER BY created_at ASC', [req.params.id]);
    ticket.responses = responses;
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/tickets/:id', (req, res) => {
  try {
    const { status, priority, assigned_to, internal_notes, custom_message } = req.body;
    
    const oldTicket = DB.get('SELECT * FROM tickets WHERE ticket_id = ?', [req.params.id]);

    DB.run(`
      UPDATE tickets 
      SET status = COALESCE(?, status), 
          priority = COALESCE(?, priority), 
          assigned_to = COALESCE(?, assigned_to), 
          internal_notes = COALESCE(?, internal_notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = ?
    `, [status, priority, assigned_to, internal_notes, req.params.id]);

    const statusChanged = oldTicket.status !== status;
    const hasCustomMsg = custom_message && custom_message.trim() !== '';

    if (oldTicket && oldTicket.phone && (statusChanged || hasCustomMsg)) {
      const whatsapp = require('../whatsapp/bot');
      let baseMessage = '';
      const finalStatus = status || oldTicket.status;
      
      if (oldTicket.status === 'Resolved' && finalStatus === 'In Progress') {
        baseMessage = `Hi ${oldTicket.name},\n\nSorry, we are still working on your service request for Ticket *${oldTicket.ticket_id}*. We had to reopen it and it is now In Progress again. We will update you once it's fully resolved!`;
      } else if (finalStatus === 'In Progress') {
        baseMessage = `Hi ${oldTicket.name},\n\nWe have started working on your service request for Ticket *${oldTicket.ticket_id}*.\n\nWe will update you once it's resolved!`;
      } else if (finalStatus === 'Resolved') {
        baseMessage = `Hi ${oldTicket.name},\n\nGreat news! Your service request for Ticket *${oldTicket.ticket_id}* has been Resolved.`;
      } else if (finalStatus === 'Closed') {
        baseMessage = `Hi ${oldTicket.name},\n\nYour service request for Ticket *${oldTicket.ticket_id}* has been Closed.`;
      } else {
        baseMessage = `Hi ${oldTicket.name},\n\nThe status of your service request (Ticket *${oldTicket.ticket_id}*) has been updated to: *${finalStatus}*.`;
      }
      
      let waMessage = baseMessage;
      
      if (hasCustomMsg) {
        waMessage += `\n\n*Note from our team:*\n${custom_message.trim()}`;
      }
      
      waMessage += `\n\nThanks,\nOpenRepair`;
      
      whatsapp.sendWhatsAppMessage(oldTicket.phone, waMessage).catch(err => console.error("WA err", err));
    }
    
    DB.logAudit(req.user.username, 'Update Ticket', 'Ticket', req.params.id, `Status: ${status || oldTicket.status}`);
    res.json({ success: true, data: 'Ticket updated' });
  } catch (error) {
    console.error("Error in PUT /tickets/:id", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/tickets/:id/respond', (req, res) => {
  try {
    const { message, sent_to_customer } = req.body;
    DB.run(`
      INSERT INTO ticket_responses (ticket_id, message, sent_by, sent_to_customer) 
      VALUES (?, ?, ?, ?)
    `, [req.params.id, message, req.user.display_name, sent_to_customer ? 1 : 0]);
    const ticket = DB.get('SELECT * FROM tickets WHERE ticket_id = ?', [req.params.id]);
    
    if (sent_to_customer && ticket) {
      // Send WA
      const whatsapp = require('../whatsapp/bot');
      if (ticket.phone) {
        const waMessage = `Hi ${ticket.name},\n\nUpdate on your Ticket *${ticket.ticket_id}*:\n\n${message}\n\nThanks,\nOpenRepair`;
        whatsapp.sendWhatsAppMessage(ticket.phone, waMessage).catch(err => console.error("WA err", err));
      }
    }
    
    res.json({ success: true, data: 'Response added' });
  } catch (error) {
    console.error("Error in POST /tickets/:id/respond", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/tickets/:id/trash', (req, res) => {
  try {
    DB.run('UPDATE tickets SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?', [req.params.id]);
    res.json({ success: true, data: 'Ticket moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/tickets/:id/restore', (req, res) => {
  try {
    DB.run('UPDATE tickets SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?', [req.params.id]);
    res.json({ success: true, data: 'Ticket restored' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/tickets/:id/permanent', requireAdmin, (req, res) => {
  try {
    DB.run('DELETE FROM ticket_responses WHERE ticket_id = ?', [req.params.id]);
    DB.run('DELETE FROM tickets WHERE ticket_id = ? AND is_deleted = 1', [req.params.id]);
    res.json({ success: true, data: 'Ticket permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ADMIN TODOS
router.get('/todos', (req, res) => {
  try {
    const todos = DB.all('SELECT * FROM admin_todos ORDER BY is_completed ASC, created_at DESC');
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/todos', (req, res) => {
  try {
    const { text } = req.body;
    DB.run('INSERT INTO admin_todos (text) VALUES (?)', [text]);
    res.json({ success: true, data: 'Todo added' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/todos/:id/toggle', (req, res) => {
  try {
    const todo = DB.get('SELECT is_completed FROM admin_todos WHERE id = ?', [req.params.id]);
    DB.run('UPDATE admin_todos SET is_completed = ? WHERE id = ?', [todo.is_completed ? 0 : 1, req.params.id]);
    res.json({ success: true, data: 'Todo toggled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/todos/:id', (req, res) => {
  try {
    DB.run('DELETE FROM admin_todos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ADMIN NOTES
router.get('/notes', (req, res) => {
  try {
    const note = DB.get('SELECT * FROM admin_notes LIMIT 1');
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/notes', (req, res) => {
  try {
    const { content } = req.body;
    const note = DB.get('SELECT id FROM admin_notes LIMIT 1');
    if (note) {
      DB.run('UPDATE admin_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, note.id]);
    } else {
      DB.run('INSERT INTO admin_notes (content) VALUES (?)', [content]);
    }
    res.json({ success: true, data: 'Note updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// CUSTOMERS
router.get('/customers', (req, res) => {
  try {
    const customers = DB.all('SELECT * FROM customers ORDER BY last_contact DESC LIMIT 100');
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PRODUCTS
router.get('/products', (req, res) => {
  try {
    const products = DB.all('SELECT * FROM products WHERE is_deleted = 0 ORDER BY sort_order ASC');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/products', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { name, category, condition, price, specs, is_active } = req.body;
    const image_path = req.file ? `/assets/products/${req.file.filename}` : null;
    const result = DB.run(`
      INSERT INTO products (name, category, condition, price, specs, image_path, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, category, condition, price, specs, image_path, is_active !== undefined ? is_active : 1]);
    DB.logAudit(req.user.username, 'Create Product', 'Product', result.lastInsertRowid, `Created ${name}`);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error("POST /products err", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/products/:id', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { name, category, condition, price, specs, is_active } = req.body;
    const productId = req.params.id;
    
    if (req.file) {
      const image_path = `/assets/products/${req.file.filename}`;
      DB.run(`
        UPDATE products 
        SET name = ?, category = ?, condition = ?, price = ?, specs = ?, image_path = ?, is_active = ?
        WHERE id = ?
      `, [name, category, condition, price, specs, image_path, is_active !== undefined ? is_active : 1, productId]);
    } else {
      DB.run(`
        UPDATE products 
        SET name = ?, category = ?, condition = ?, price = ?, specs = ?, is_active = ?
        WHERE id = ?
      `, [name, category, condition, price, specs, is_active !== undefined ? is_active : 1, productId]);
    }
    DB.logAudit(req.user.username, 'Update Product', 'Product', productId, `Updated ${name}`);
    res.json({ success: true, data: 'Product updated' });
  } catch (error) {
    console.error("PUT /products err", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    DB.run('UPDATE products SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    DB.logAudit(req.user.username, 'Delete Product', 'Product', req.params.id, `Deleted product ${req.params.id}`);
    res.json({ success: true, data: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// AUDIT LOGS (Requires Admin)
router.get('/audit-logs', requireAdmin, (req, res) => {
  try {
    const logs = DB.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// USERS (Requires Admin)
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = DB.all('SELECT id, username, display_name, role, is_active, last_login, created_at, photo_url, recovery_phone FROM admin_users WHERE is_active = 1');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PROFILE (Current User)
router.put('/profile', upload.single('photo'), (req, res) => {
  try {
    const { display_name, recovery_phone, password } = req.body;
    let query = 'UPDATE admin_users SET display_name = ?, recovery_phone = ?';
    const params = [display_name, recovery_phone];

    if (req.file) {
      query += ', photo_url = ?';
      params.push(`/assets/products/${req.file.filename}`); // using products dir for now
    }

    if (password && password.trim().length > 0) {
      query += ', password_hash = ?';
      params.push(bcrypt.hashSync(password, 12));
    }

    query += ' WHERE id = ?';
    params.push(req.user.id);

    DB.run(query, params);
    DB.logAudit(req.user.username, 'Update Profile', 'User', req.user.id, 'User updated their profile');

    res.json({ success: true, data: 'Profile updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/users', requireAdmin, (req, res) => {
  try {
    const { username, password, display_name, role } = req.body;
    const hash = bcrypt.hashSync(password, 12);
    const result = DB.run(`
      INSERT INTO admin_users (username, password_hash, display_name, role, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [username, hash, display_name, role, req.user.username]);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error("POST /users error:", error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE'))) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/users/:id', requireAdmin, (req, res) => {
  try {
    // Prevent deleting oneself
    if (req.params.id == req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }
    
    // Append timestamp to username to free it up for reuse
    DB.run('UPDATE admin_users SET is_active = 0, username = username || "_deleted_" || strftime("%s","now") WHERE id = ?', [req.params.id]);
    DB.logAudit(req.user.username, 'Delete User', 'User', req.params.id, `Deactivated user ${req.params.id}`);
    res.json({ success: true, data: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// BANNERS
router.get('/banner', (req, res) => {
  try {
    const banners = DB.all('SELECT * FROM banners ORDER BY created_at DESC');
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/banner/:id/toggle', (req, res) => {
  try {
    DB.transaction(() => {
      DB.run('UPDATE banners SET is_active = 0');
      DB.run('UPDATE banners SET is_active = 1 WHERE id = ?', [req.params.id]);
    });
    res.json({ success: true, data: 'Banner toggled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// INVOICES (Billing)
function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${yyyy}${mm}`;
  
  const lastInvoice = DB.get(`SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1`, [`${prefix}-%`]);
  
  let seq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoice_number.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  
  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

router.get('/invoices', (req, res) => {
  try {
    const invoices = DB.all(`
      SELECT i.*, c.name as customer_name,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = i.id) as total_paid
      FROM invoices i 
      LEFT JOIN customers c ON i.customer_id = c.id 
      WHERE i.is_deleted = 0
      ORDER BY i.created_at DESC
    `);
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/invoices', (req, res) => {
  try {
    const { customer_id, ticket_id, items, tax_percent, discount_amount = 0, notes, due_date, status = 'Draft' } = req.body;
    
    // items should be an array of {description, qty, rate}
    let subtotal = 0;
    const processedItems = items.map(item => {
      const amount = item.qty * item.rate;
      subtotal += amount;
      return { ...item, amount };
    });
    
    const discountedSubtotal = Math.max(0, subtotal - discount_amount);
    const tax_amount = discountedSubtotal * (tax_percent / 100);
    const total = discountedSubtotal + tax_amount;
    const invoice_number = generateInvoiceNumber();
    
    const result = DB.run(`
      INSERT INTO invoices (invoice_number, customer_id, ticket_id, items, subtotal, discount_amount, tax_percent, tax_amount, total, due_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number, customer_id, ticket_id, 
      JSON.stringify(processedItems), 
      subtotal, discount_amount, tax_percent, tax_amount, total, due_date, notes, status
    ]);
    
    res.json({ success: true, data: { id: result.lastInsertRowid, invoice_number } });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/invoices/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    DB.run('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, data: 'Invoice status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/whatsapp/status', (req, res) => {
  try {
    const whatsapp = require('../whatsapp/bot');
    res.json({
      success: true,
      data: {
        isReady: whatsapp.isReady(),
        qr: whatsapp.getQR()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/whatsapp/logout', async (req, res) => {
  try {
    const whatsapp = require('../whatsapp/bot');
    await whatsapp.logout();
    res.json({ success: true, message: 'Logged out of WhatsApp' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/invoices/:id/send-whatsapp', async (req, res) => {
  try {
    const invoice = DB.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    
    const customer = DB.get('SELECT * FROM customers WHERE id = ?', [invoice.customer_id]);
    if (!customer || !customer.phone) return res.status(400).json({ success: false, error: 'Customer has no phone number' });
    
    // Generate PDF
    const { generateInvoicePDF } = require('../utils/pdf');
    const fs = require('fs');
    const path = require('path');
    
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const pdfPath = path.join(tmpDir, `Invoice_${invoice.invoice_number}.pdf`);
    await generateInvoicePDF(invoice, customer, pdfPath);
    
    // Send WhatsApp PDF
    const whatsapp = require('../whatsapp/bot');
    const caption = `Hello ${customer.name},\n\nHere is your invoice ${invoice.invoice_number} for ₹${invoice.total.toFixed(2)}.\n\nThank you for choosing OpenRepair!`;
    const sent = await whatsapp.sendWhatsAppPDF(customer.phone, pdfPath, caption);
    
    if (sent) {
      if (invoice.status === 'Draft') {
        DB.run('UPDATE invoices SET status = "Sent" WHERE id = ?', [invoice.id]);
      }
      res.json({ success: true, data: 'Invoice sent via WhatsApp successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send WhatsApp message. Bot might not be ready.' });
    }
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/invoices/:id/send', async (req, res) => {
  try {
    const invoice = DB.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    
    const customer = DB.get('SELECT * FROM customers WHERE id = ?', [invoice.customer_id]);
    if (!customer || !customer.email) return res.status(400).json({ success: false, error: 'Customer has no email' });
    
    // Generate PDF
    const { generateInvoicePDF } = require('../utils/pdf');
    const fs = require('fs');
    const path = require('path');
    
    // Ensure temp directory exists
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const pdfPath = path.join(tmpDir, `Invoice_${invoice.invoice_number}.pdf`);
    await generateInvoicePDF(invoice, customer, pdfPath);
    
    // Send email
    const mailer = require('../email/mailer');
    const sent = await mailer.sendInvoice(invoice, customer, pdfPath);
    
    if (sent) {
      // Update status to Sent if it was Draft
      if (invoice.status === 'Draft') {
        DB.run('UPDATE invoices SET status = "Sent" WHERE id = ?', [invoice.id]);
      }
      res.json({ success: true, data: 'Invoice sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email. Check SMTP configuration.' });
    }
  } catch (error) {
    console.error('Invoice send error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const invoice = DB.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoice) return res.status(404).send('Invoice not found');
    
    const customer = DB.get('SELECT * FROM customers WHERE id = ?', [invoice.customer_id]);
    if (!customer) return res.status(400).send('Customer not found');
    
    const { generateInvoicePDF } = require('../utils/pdf');
    const fs = require('fs');
    const path = require('path');
    
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const pdfPath = path.join(tmpDir, `Invoice_${invoice.invoice_number}.pdf`);
    await generateInvoicePDF(invoice, customer, pdfPath);
    
    res.download(pdfPath, `Invoice_${invoice.invoice_number}.pdf`, (err) => {
      if (err) console.error("Error downloading file:", err);
      // Optional: Delete file after download
      // fs.unlinkSync(pdfPath);
    });
  } catch (error) {
    console.error('Invoice PDF error:', error);
    res.status(500).send('Internal server error');
  }
});

// Partial Payments API
router.get('/invoices/:id/payments', (req, res) => {
  try {
    const payments = DB.all('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC', [req.params.id]);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/invoices/:id/payments', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { amount, method, reference, notes } = req.body;
    
    // Add payment
    DB.run(`
      INSERT INTO payments (invoice_id, amount, method, reference, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [invoiceId, amount, method, reference, notes]);
    
    // Check if fully paid
    const invoice = DB.get('SELECT total FROM invoices WHERE id = ?', [invoiceId]);
    const payments = DB.all('SELECT amount FROM payments WHERE invoice_id = ?', [invoiceId]);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= invoice.total) {
      DB.run('UPDATE invoices SET status = "Paid" WHERE id = ?', [invoiceId]);
    } else {
      DB.run('UPDATE invoices SET status = "Partial" WHERE id = ?', [invoiceId]);
    }
    
    res.json({ success: true, data: { totalPaid, total: invoice.total } });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/invoices/:id/payments/:payment_id', (req, res) => {
  try {
    const { id, payment_id } = req.params;
    
    // Delete payment
    DB.run('DELETE FROM payments WHERE id = ? AND invoice_id = ?', [payment_id, id]);
    
    // Recalculate invoice status
    const invoice = DB.get('SELECT total FROM invoices WHERE id = ?', [id]);
    const payments = DB.all('SELECT amount FROM payments WHERE invoice_id = ?', [id]);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    let newStatus = invoice.status;
    if (totalPaid === 0 && invoice.status !== 'Estimate') {
      newStatus = 'Draft'; // or whatever the default open status is
    } else if (totalPaid >= invoice.total) {
      newStatus = 'Paid';
    } else if (totalPaid > 0 && totalPaid < invoice.total) {
      newStatus = 'Partial';
    }
    
    DB.run('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, id]);
    
    res.json({ success: true, data: 'Payment deleted and status updated' });
  } catch (error) {
    console.error('Payment delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    DB.run('UPDATE invoices SET is_deleted = 1 WHERE id = ?', [id]);
    res.json({ success: true, data: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoice delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// AMC PLANS — CRUD operations for Annual Maintenance Contracts
// ============================================================
router.get('/plans', (req, res) => {
  try {
    const plans = DB.all('SELECT * FROM amc_plans WHERE is_deleted = 0 ORDER BY sort_order ASC');
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/plans', requireAdmin, (req, res) => {
  try {
    const { name, icon, target_audience, features, is_featured, sort_order, color } = req.body;
    const result = DB.run(
      'INSERT INTO amc_plans (name, icon, target_audience, features, is_featured, sort_order, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, icon || '🛡️', target_audience, JSON.stringify(features), is_featured ? 1 : 0, sort_order || 0, color]
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/plans/:id', requireAdmin, (req, res) => {
  try {
    const { name, icon, target_audience, features, is_featured, sort_order, color } = req.body;
    DB.run(
      'UPDATE amc_plans SET name=COALESCE(?,name), icon=COALESCE(?,icon), target_audience=COALESCE(?,target_audience), features=COALESCE(?,features), is_featured=COALESCE(?,is_featured), sort_order=COALESCE(?,sort_order), color=COALESCE(?,color) WHERE id=?',
      [name, icon, target_audience, features ? JSON.stringify(features) : null, is_featured !== undefined ? (is_featured ? 1 : 0) : null, sort_order, color, req.params.id]
    );
    res.json({ success: true, data: 'Plan updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/plans/:id', requireAdmin, (req, res) => {
  try {
    DB.run('UPDATE amc_plans SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// REPLY TEMPLATES — Pre-written responses for quick ticket replies
// ============================================================
router.get('/templates', (req, res) => {
  try {
    const templates = DB.all('SELECT * FROM reply_templates ORDER BY category ASC');
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/templates', requireAdmin, (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const result = DB.run(
      'INSERT INTO reply_templates (name, subject, body, category) VALUES (?, ?, ?, ?)',
      [name, subject, body, category || 'General']
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/templates/:id', requireAdmin, (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    DB.run(
      'UPDATE reply_templates SET name=COALESCE(?,name), subject=COALESCE(?,subject), body=COALESCE(?,body), category=COALESCE(?,category) WHERE id=?',
      [name, subject, body, category, req.params.id]
    );
    res.json({ success: true, data: 'Template updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/templates/:id', requireAdmin, (req, res) => {
  try {
    DB.run('DELETE FROM reply_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// CMS CONTENT — Editable website content (hero text, etc.)
// ============================================================
router.get('/content', (req, res) => {
  try {
    const content = DB.all('SELECT * FROM cms_content ORDER BY section ASC');
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/content', requireAdmin, (req, res) => {
  try {
    const updates = req.body;
    DB.transaction(() => {
      for (const [id, value] of Object.entries(updates)) {
        DB.run('UPDATE cms_content SET content_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [value, id]);
      }
    });
    res.json({ success: true, data: 'Content updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// BANNERS — Create and toggle announcement banners
// ============================================================
router.post('/banner', requireAdmin, (req, res) => {
  try {
    const { text, link, bg_color, text_color } = req.body;
    const result = DB.run(
      'INSERT INTO banners (text, link, bg_color, text_color, is_active) VALUES (?, ?, ?, ?, 0)',
      [text, link, bg_color || '#1e40af', text_color || '#ffffff']
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/banners/:id/toggle', (req, res) => {
  try {
    const banner = DB.get('SELECT * FROM banners WHERE id = ?', [req.params.id]);
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found' });
    // Deactivate all banners first, then toggle this one
    DB.run('UPDATE banners SET is_active = 0');
    if (!banner.is_active) {
      DB.run('UPDATE banners SET is_active = 1 WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true, data: 'Banner toggled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// TESTIMONIALS — Manage Testimonials
// ============================================================
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = DB.all('SELECT * FROM testimonials WHERE is_deleted = 0 ORDER BY sort_order ASC');
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/testimonials', requireAdmin, (req, res) => {
  try {
    const { name, role, stars, text } = req.body;
    const result = DB.run(
      'INSERT INTO testimonials (name, role, stars, text, is_active, sort_order) VALUES (?, ?, ?, ?, 1, 0)',
      [name, role, stars, text]
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/testimonials/:id/toggle', requireAdmin, (req, res) => {
  try {
    const t = DB.get('SELECT is_active FROM testimonials WHERE id = ?', [req.params.id]);
    if (!t) return res.status(404).json({ success: false, error: 'Not found' });
    DB.run('UPDATE testimonials SET is_active = ? WHERE id = ?', [t.is_active ? 0 : 1, req.params.id]);
    res.json({ success: true, data: 'Toggled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/testimonials/:id', requireAdmin, (req, res) => {
  try {
    DB.run('UPDATE testimonials SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================
// TRASH — Unified deleted items
// ============================================================
router.get('/trash', (req, res) => {
  try {
    const tickets = DB.all('SELECT * FROM tickets WHERE is_deleted = 1');
    const products = DB.all('SELECT * FROM products WHERE is_deleted = 1');
    const invoices = DB.all('SELECT * FROM invoices WHERE is_deleted = 1');
    const plans = DB.all('SELECT * FROM amc_plans WHERE is_deleted = 1');
    const testimonials = DB.all('SELECT * FROM testimonials WHERE is_deleted = 1');
    res.json({ success: true, data: { tickets, products, invoices, plans, testimonials } });
  } catch (error) {
    console.error("GET /trash error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/trash/restore', (req, res) => {
  try {
    const { table, id } = req.body;
    const allowed = ['tickets', 'products', 'invoices', 'amc_plans', 'testimonials'];
    if (!allowed.includes(table)) return res.status(400).json({ success: false });
    
    if (table === 'tickets') {
      DB.run(`UPDATE tickets SET is_deleted = 0 WHERE ticket_id = ?`, [id]);
    } else {
      DB.run(`UPDATE ${table} SET is_deleted = 0 WHERE id = ?`, [id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("PUT /trash/restore error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/trash/permanent', (req, res) => {
  try {
    const { table, id } = req.body;
    const allowed = ['tickets', 'products', 'invoices', 'amc_plans', 'testimonials'];
    if (!allowed.includes(table)) return res.status(400).json({ success: false });
    
    if (table === 'tickets') {
      DB.run('DELETE FROM ticket_responses WHERE ticket_id = ?', [id]);
      DB.run(`DELETE FROM tickets WHERE ticket_id = ?`, [id]);
    } else if (table === 'invoices') {
      DB.run('DELETE FROM payments WHERE invoice_id = ?', [id]);
      DB.run(`DELETE FROM invoices WHERE id = ?`, [id]);
    } else {
      DB.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /trash/permanent error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ANALYTICS
router.get('/analytics/overview', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayViews = DB.get(
      `SELECT COUNT(*) as count FROM page_views WHERE date(created_at) = date(?)`, [today]
    );
    
    const todayUnique = DB.get(
      `SELECT COUNT(DISTINCT ip_hash) as count FROM page_views WHERE date(created_at) = date(?)`, [today]
    );
    
    const totalViews = DB.get(`SELECT COUNT(*) as count FROM page_views`);
    
    // Last 7 days trend
    const trend = DB.all(`
      SELECT date(created_at) as day, COUNT(*) as views, COUNT(DISTINCT ip_hash) as visitors
      FROM page_views 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) 
      ORDER BY day ASC
    `);
    
    // Top pages
    const topPages = DB.all(`
      SELECT page, COUNT(*) as views 
      FROM page_views 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY page 
      ORDER BY views DESC 
      LIMIT 10
    `);
    
    // Top referrers
    const topReferrers = DB.all(`
      SELECT referrer, COUNT(*) as count 
      FROM page_views 
      WHERE referrer != '' AND created_at >= datetime('now', '-7 days')
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 10
    `);

    res.json({ success: true, data: {
      todayViews: todayViews.count,
      todayUnique: todayUnique.count,
      totalViews: totalViews.count,
      trend,
      topPages,
      topReferrers
    }});
  } catch (error) {
    console.error("GET /analytics/overview error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
