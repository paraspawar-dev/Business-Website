const express = require('express');
const DB = require('../db/database');
const router = express.Router();

// Helper to generate ticket ID
function generateTicketId() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `CL-${yyyy}${mm}${dd}`;
  
  // Find highest sequence for today
  const lastTicket = DB.get(`SELECT ticket_id FROM tickets WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1`, [`${prefix}-%`]);
  
  let seq = 1;
  if (lastTicket) {
    const parts = lastTicket.ticket_id.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  
  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date() } });
});

// POST /api/tickets
router.post('/tickets', (req, res) => {
  const { name, phone, email, address, company, service_type, device, description, preferred_date } = req.body;
  
  if (!name || !phone || !service_type || !description) {
    return res.status(400).json({ success: false, error: 'Required fields missing' });
  }

  try {
    let customerId;
    let ticketId;
    
    DB.transaction(() => {
      // Find or create customer
      const existingCustomer = DB.get('SELECT id FROM customers WHERE phone = ?', [phone]);
      if (existingCustomer) {
        customerId = existingCustomer.id;
        DB.run('UPDATE customers SET total_tickets = total_tickets + 1, last_contact = CURRENT_TIMESTAMP, address = COALESCE(?, address), company = COALESCE(?, company) WHERE id = ?', [address, company, customerId]);
      } else {
        const result = DB.run('INSERT INTO customers (name, phone, email, address, company, total_tickets) VALUES (?, ?, ?, ?, ?, 1)', [name, phone, email, address, company]);
        customerId = result.lastInsertRowid;
      }
      
      ticketId = generateTicketId();
      
      DB.run(`
        INSERT INTO tickets (ticket_id, name, phone, email, company, address, service_type, device, description, preferred_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
      `, [ticketId, name, phone, email, company, address, service_type, device, description, preferred_date]);
    });

    // Send WhatsApp to Admin asynchronously (Do NOT notify customer yet)
    const whatsapp = require('../whatsapp/bot');
    
    // Send WhatsApp to Admin asynchronously
    const adminMessage = `*[NEW TICKET]* ${ticketId}\n\n*Name:* ${name}\n*Company:* ${company || 'N/A'}\n*Phone:* ${phone}\n*Location:* ${address || 'N/A'}\n*Service:* ${service_type}\n*Device:* ${device || 'N/A'}\n*Issue:* ${description}`;
    whatsapp.sendWhatsAppMessage('7700932311', adminMessage).catch(err => console.error("WA Admin err", err));
    
    // Send WhatsApp to Customer asynchronously
    const customerMessage = `Hi ${name}, 👋\n\nThank you for choosing *OpenRepair*! We have successfully received your service request.\n\n🎫 *Ticket ID:* ${ticketId}\n🏢 *Company:* ${company || 'N/A'}\n🔧 *Service:* ${service_type}\n💻 *Device:* ${device || 'N/A'}\n📍 *Location:* ${address || 'N/A'}\n📝 *Issue:* ${description}\n\nOur technical team will review your request and contact you shortly.\n\n🔍 *Track Your Repair:*\nYou can check the live status of your device anytime on our website:\n1. Visit https://caliberlink.in\n2. Scroll to the "Track Repair" section\n3. Enter your Ticket ID (*${ticketId}*) and this phone number.\n\n_If you need immediate assistance, please reply to this message._`;
    whatsapp.sendWhatsAppMessage(phone, customerMessage).catch(err => console.error("WA Customer err", err));
    
    res.status(201).json({ success: true, data: { ticket_id: ticketId } });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

// GET /api/content/:section
router.get('/content/:section', (req, res) => {
  try {
    const content = DB.all('SELECT content_key, content_value, content_type FROM cms_content WHERE section = ?', [req.params.section]);
    const formatted = {};
    content.forEach(c => {
      formatted[c.content_key] = c.content_type === 'json' ? JSON.parse(c.content_value) : c.content_value;
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/products
router.get('/products', (req, res) => {
  try {
    let query = 'SELECT * FROM products WHERE is_active = 1 AND is_deleted = 0';
    const params = [];
    
    if (req.query.category) {
      query += ' AND category = ?';
      params.push(req.query.category);
    }
    
    query += ' ORDER BY sort_order ASC, created_at DESC';
    
    const products = DB.all(query, params);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/plans
router.get('/plans', (req, res) => {
  try {
    const plans = DB.all('SELECT * FROM amc_plans WHERE is_deleted = 0 ORDER BY sort_order ASC');
    const formatted = plans.map(p => ({
      ...p,
      features: JSON.parse(p.features)
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/banner
router.get('/banner', (req, res) => {
  try {
    const banner = DB.get('SELECT * FROM banners WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1');
    res.json({ success: true, data: banner || null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/testimonials
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = DB.all('SELECT * FROM testimonials WHERE is_active = 1 AND is_deleted = 0 ORDER BY sort_order ASC');
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/brands
router.get('/brands', (req, res) => {
  res.json({ success: true, data: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Samsung', 'Microsoft', 'Canon', 'Epson', 'LG', 'Sony', 'Toshiba', 'MSI'] });
});

// POST /api/analytics/pageview — Privacy-first analytics tracker
router.post('/analytics/pageview', (req, res) => {
  try {
    const { page, referrer } = req.body;
    if (!page) return res.status(400).json({ success: false, error: 'Page required' });
    
    // Hash IP for privacy — never store raw IP
    const crypto = require('crypto');
    const clientIp = req.ip || req.connection.remoteAddress;
    const ipHash = crypto.createHash('sha256').update(clientIp + 'clink-salt-2026').digest('hex').substring(0, 16);
    
    const userAgent = req.headers['user-agent'] || '';
    
    DB.run('INSERT INTO page_views (page, referrer, user_agent, ip_hash) VALUES (?, ?, ?, ?)', 
      [page, referrer || '', userAgent, ipHash]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/tickets/track
// Public tracking endpoint requiring both Ticket ID and Phone Number for security
router.get('/tickets/track', (req, res) => {
  try {
    const { ticket_id, phone } = req.query;
    
    if (!ticket_id || !phone) {
      return res.status(400).json({ success: false, error: 'Ticket ID and Phone Number are required' });
    }
    
    // Find ticket ensuring phone number matches exactly or with a country code prefix
    // By using LIKE '%' || ?, it matches '7700091924' as well as '+917700091924'
    const ticket = DB.get(`
      SELECT ticket_id, name, device, service_type, status, preferred_date, created_at
      FROM tickets 
      WHERE ticket_id = ? AND phone LIKE '%' || ? AND is_deleted = 0
    `, [ticket_id, phone]);
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'No ticket found with this ID and phone number' });
    }
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Ticket tracking error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
