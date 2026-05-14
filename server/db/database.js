const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Database singleton.
 * Initializes SQLite database and runs schema migrations on first connect.
 */

const DB_PATH = process.env.DB_PATH || './data/naukriboost.db';
const dbDir = path.dirname(path.resolve(__dirname, '..', DB_PATH));

/* Ensure the data directory exists */
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFile = path.resolve(__dirname, '..', DB_PATH);
const db = new Database(dbFile);

/* Enable WAL mode for better concurrent read performance */
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize the database schema.
 * Reads schema.sql and executes it. Safe to call multiple times
 * because all statements use IF NOT EXISTS.
 */
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('✅ Database initialized at:', dbFile);
}

/* Run on import */
initializeDatabase();

module.exports = db;
