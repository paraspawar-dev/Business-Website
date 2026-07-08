const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Initialize database connection
let db;
try {
  db = new Database(dbPath, {
    // verbose: console.log // Enable for debugging
  });
  
  // Enable Write-Ahead Logging (WAL) for better performance and concurrency
  db.pragma('journal_mode = WAL');
  
  // Create tables if they don't exist
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Wrapper for database operations
const DB = {
  // Run a query that doesn't return rows (INSERT, UPDATE, DELETE)
  run: (sql, params = []) => {
    return db.prepare(sql).run(params);
  },
  
  // Get a single row
  get: (sql, params = []) => {
    return db.prepare(sql).get(params);
  },
  
  // Get multiple rows
  all: (sql, params = []) => {
    return db.prepare(sql).all(params);
  },
  
  // Execute a transaction
  transaction: (fn) => {
    return db.transaction(fn)();
  },
  
  // Audit logger
  logAudit: (username, action, entity_type = null, entity_id = null, details = null) => {
    try {
      db.prepare('INSERT INTO audit_logs (username, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(username, action, entity_type, entity_id, details ? JSON.stringify(details) : null);
    } catch (e) {
      console.error("Audit Log Error:", e);
    }
  },

  // Direct access to the db instance if needed
  instance: db
};

module.exports = DB;
