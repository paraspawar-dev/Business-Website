-- TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  service_type TEXT NOT NULL,
  device TEXT,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Normal',
  preferred_date TEXT,
  status TEXT DEFAULT 'Open',
  assigned_to TEXT,
  internal_notes TEXT,
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS (auto-created from tickets)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  total_tickets INTEGER DEFAULT 0,
  first_contact DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contact DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- TICKET RESPONSES
CREATE TABLE IF NOT EXISTS ticket_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  sent_to_customer BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
);

-- REPLY TEMPLATES
CREATE TABLE IF NOT EXISTS reply_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT 0
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  created_by TEXT,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  photo_url TEXT,
  recovery_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CMS CONTENT
CREATE TABLE IF NOT EXISTS cms_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section, content_key)
);

-- ADMIN TODOS
CREATE TABLE IF NOT EXISTS admin_todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN NOTES
CREATE TABLE IF NOT EXISTS admin_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  price REAL NOT NULL,
  specs TEXT,
  image_path TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_deleted BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AMC PLANS
CREATE TABLE IF NOT EXISTS amc_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT,
  target_audience TEXT,
  features TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  color TEXT
);

-- ANNOUNCEMENT BANNER
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  link_text TEXT,
  link_url TEXT,
  bg_color TEXT DEFAULT '#0066FF',
  is_active BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TESTIMONIALS
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  stars INTEGER DEFAULT 5,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER,
  ticket_id TEXT,
  items TEXT NOT NULL,
  subtotal REAL,
  discount_amount REAL DEFAULT 0,
  tax_percent REAL DEFAULT 18,
  tax_amount REAL,
  total REAL,
  status TEXT DEFAULT 'Draft',
  due_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- PAYMENT RECORDS
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  method TEXT DEFAULT 'Cash',
  reference TEXT,
  notes TEXT,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ANALYTICS (private website traffic tracking)
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
