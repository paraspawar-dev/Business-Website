const db = require('./database');

console.log("Starting database migration for customer info...");

try {
  // Add columns to tickets table
  try {
    db.run("ALTER TABLE tickets ADD COLUMN company TEXT");
    console.log("Added 'company' to tickets");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'company' already exists in tickets");
    } else throw e;
  }
  
  try {
    db.run("ALTER TABLE tickets ADD COLUMN address TEXT");
    console.log("Added 'address' to tickets");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'address' already exists in tickets");
    } else throw e;
  }

  // Add columns to customers table
  try {
    db.run("ALTER TABLE customers ADD COLUMN company TEXT");
    console.log("Added 'company' to customers");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'company' already exists in customers");
    } else throw e;
  }
  
  try {
    db.run("ALTER TABLE customers ADD COLUMN address TEXT");
    console.log("Added 'address' to customers");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("'address' already exists in customers");
    } else throw e;
  }

  console.log("Migration successful!");
} catch (error) {
  console.error("Migration failed:", error);
}
