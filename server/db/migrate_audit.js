const db = require('./database');

console.log("Starting database migration for audit logs and admin profile...");

try {
  // Add columns to admin_users table
  try {
    db.run("ALTER TABLE admin_users ADD COLUMN photo_url TEXT");
    console.log("Added 'photo_url' to admin_users");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'photo_url' already exists in admin_users");
    } else throw e;
  }
  
  try {
    db.run("ALTER TABLE admin_users ADD COLUMN recovery_phone TEXT");
    console.log("Added 'recovery_phone' to admin_users");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'recovery_phone' already exists in admin_users");
    } else throw e;
  }

  // Create audit_logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Created 'audit_logs' table");

  console.log("Migration successful!");
} catch (error) {
  console.error("Migration failed:", error);
}
