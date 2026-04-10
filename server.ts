import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Initialize Telegram Bot
let bot: TelegramBot | null = null;
if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: false });
}

const sendTelegramMessage = (message: string) => {
  if (bot && CHAT_ID) {
    bot.sendMessage(CHAT_ID, message, { parse_mode: 'HTML' }).catch(err => console.error('Telegram error:', err));
  }
};

// Database Setup
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0.0,
    referral_code TEXT,
    referred_by TEXT,
    kyc_status TEXT DEFAULT 'none',
    win_rate INTEGER DEFAULT 50,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount REAL,
    network TEXT,
    address TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS kyc_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    full_name TEXT,
    document_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { email, password, referral } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    db.run(`INSERT INTO users (email, password, referral_code, referred_by, ip_address) VALUES (?, ?, ?, ?, ?)`, 
      [email, hashedPassword, referralCode, referral || null, ip], 
      function(err) {
        if (err) return res.status(400).json({ error: 'Email already exists' });
        
        sendTelegramMessage(`🚀 <b>New Registration</b>\n📧 Email: ${email}\n🌐 IP: ${ip}\n🔗 Ref: ${referral || 'None'}`);
        res.json({ message: 'User registered successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user: any) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true });
    res.json({ message: 'Logged in successfully' });
  });
});

app.get('/api/user', authenticateToken, (req: any, res) => {
  db.get(`SELECT id, email, balance, referral_code, kyc_status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(user);
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Transaction Routes
app.post('/api/deposit', authenticateToken, (req: any, res) => {
  const { amount, network, address } = req.body;
  db.run(`INSERT INTO transactions (user_id, type, amount, network, address) VALUES (?, 'deposit', ?, ?, ?)`,
    [req.user.id, amount, network, address],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      sendTelegramMessage(`💰 <b>New Deposit Request</b>\n📧 User: ${req.user.email}\n💵 Amount: ${amount} ${network}\n📍 Address: ${address}`);
      res.json({ message: 'Deposit request submitted' });
    }
  );
});

app.post('/api/withdraw', authenticateToken, (req: any, res) => {
  const { amount, network, address } = req.body;
  
  db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, user: any) => {
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    db.run(`INSERT INTO transactions (user_id, type, amount, network, address) VALUES (?, 'withdraw', ?, ?, ?)`,
      [req.user.id, amount, network, address],
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        sendTelegramMessage(`💸 <b>New Withdrawal Request</b>\n📧 User: ${req.user.email}\n💵 Amount: ${amount} ${network}\n📍 Address: ${address}`);
        res.json({ message: 'Withdrawal request submitted' });
      }
    );
  });
});

// KYC Routes
app.post('/api/kyc', authenticateToken, (req: any, res) => {
  const { fullName, documentNumber } = req.body;
  db.run(`INSERT INTO kyc_requests (user_id, full_name, document_number) VALUES (?, ?, ?)`,
    [req.user.id, fullName, documentNumber],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.run(`UPDATE users SET kyc_status = 'pending' WHERE id = ?`, [req.user.id]);
      sendTelegramMessage(`🆔 <b>New KYC Request</b>\n📧 User: ${req.user.email}\n👤 Name: ${fullName}\n📄 Doc: ${documentNumber}`);
      res.json({ message: 'KYC request submitted' });
    }
  );
});

// Admin Routes
const isAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err || user.email !== (process.env.ADMIN_USER || 'admin')) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
};

app.get('/api/admin/users', isAdmin, (req, res) => {
  db.all(`SELECT * FROM users`, (err, rows) => res.json(rows));
});

app.get('/api/admin/transactions', isAdmin, (req, res) => {
  db.all(`SELECT t.*, u.email FROM transactions t JOIN users u ON t.user_id = u.id`, (err, rows) => res.json(rows));
});

app.post('/api/admin/approve-transaction', isAdmin, (req, res) => {
  const { id, status } = req.body;
  db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, tx: any) => {
    if (status === 'approved') {
      const balanceChange = tx.type === 'deposit' ? tx.amount : -tx.amount;
      db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [balanceChange, tx.user_id]);
    }
    db.run(`UPDATE transactions SET status = ? WHERE id = ?`, [status, id], () => res.json({ message: 'Transaction updated' }));
  });
});

app.post('/api/admin/update-balance', isAdmin, (req, res) => {
  const { userId, amount } = req.body;
  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId], () => res.json({ message: 'Balance updated' }));
});

app.post('/api/admin/update-win-rate', isAdmin, (req, res) => {
  const { userId, winRate } = req.body;
  db.run(`UPDATE users SET win_rate = ? WHERE id = ?`, [winRate, userId], () => res.json({ message: 'Win rate updated' }));
});

app.post('/api/admin/approve-kyc', isAdmin, (req, res) => {
  const { userId, status } = req.body;
  db.run(`UPDATE users SET kyc_status = ? WHERE id = ?`, [status, userId], () => {
    sendTelegramMessage(`✅ <b>KYC ${status === 'verified' ? 'Approved' : 'Rejected'}</b>\n👤 User ID: ${userId}`);
    res.json({ message: 'KYC status updated' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
