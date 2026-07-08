const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../server/db/data.db');
const db = new Database(dbPath);

console.log('Running database migrations...');

try {
  // Add is_deleted to tickets
  db.exec('ALTER TABLE tickets ADD COLUMN is_deleted BOOLEAN DEFAULT 0');
  console.log('Added is_deleted to tickets table');
} catch (err) {
  console.log('is_deleted column may already exist: ' + err.message);
}

try {
  // Add discount_amount to invoices
  db.exec('ALTER TABLE invoices ADD COLUMN discount_amount REAL DEFAULT 0');
  console.log('Added discount_amount to invoices table');
} catch (err) {
  console.log('discount_amount column may already exist: ' + err.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Created admin_todos table');
} catch (err) {
  console.log('Error creating admin_todos: ' + err.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Created admin_notes table');
  
  // Seed the first note
  const row = db.prepare('SELECT COUNT(*) as count FROM admin_notes').get();
  if (row.count === 0) {
    db.prepare('INSERT INTO admin_notes (content) VALUES (?)').run('Going to the company and planning meetings for the week ahead 🏀');
    console.log('Seeded first note');
  }
} catch (err) {
  console.log('Error creating admin_notes: ' + err.message);
}

console.log('Migrations completed successfully.');
db.close();
