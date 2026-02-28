const Database = require('better-sqlite3');
const db = new Database('motel.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT,
    room_type TEXT,
    price REAL,
    status TEXT
);

CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    id_number TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    guest_id INTEGER,
    check_in TEXT,
    check_out TEXT,
    nights INTEGER,
    total_amount REAL,
    payment_method TEXT,
    payment_status TEXT,
    cashier TEXT,
    receipt_number TEXT
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    category TEXT,
    available INTEGER
);

CREATE TABLE IF NOT EXISTS restaurant_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT,
    total REAL,
    vat REAL,
    payment_method TEXT,
    cashier TEXT,
    receipt_number TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    menu_item_id INTEGER,
    quantity INTEGER,
    price REAL
);
`);

module.exports = db;