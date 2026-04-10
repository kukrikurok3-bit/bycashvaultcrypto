import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bycashvault-secret-key-2026';

app.use(express.json());
app.use(cookieParser());

// Database Setup
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        balance REAL DEFAULT 0,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        kyc_status TEXT DEFAULT 'not_verified',
        role TEXT DEFAULT 'user',
        win_rate INTEGER DEFAULT 70,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        coin TEXT,
        network TEXT,
        address TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        coin TEXT,
        network TEXT,
        address TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Middleware
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
    const { email, password, ref } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    db.run('INSERT INTO users (email, password, referral_code, referred_by) VALUES (?, ?, ?, ?)', 
        [email, hashedPassword, referralCode, ref || null], 
        function(err) {
            if (err) return res.status(400).json({ error: 'Email already exists' });
            const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET);
            res.cookie('token', token, { httpOnly: true });
            res.json({ success: true });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: any) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });
        res.json({ success: true, role: user.role });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// User Routes
app.get('/api/user', authenticateToken, (req: any, res) => {
    db.get('SELECT id, email, balance, referral_code, kyc_status, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
        res.json(user);
    });
});

app.get('/api/user/addresses', authenticateToken, (req: any, res) => {
    db.all('SELECT * FROM user_addresses WHERE user_id = ?', [req.user.id], (err, addresses) => {
        res.json(addresses);
    });
});

// Transaction Routes
app.post('/api/deposit', authenticateToken, (req: any, res) => {
    const { coin, network, amount, address } = req.body;
    db.run('INSERT INTO transactions (user_id, type, amount, coin, network, address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'deposit', amount, coin, network, address],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.post('/api/withdraw', authenticateToken, (req: any, res) => {
    const { coin, network, amount, address } = req.body;
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, user: any) => {
        if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
        
        db.run('INSERT INTO transactions (user_id, type, amount, coin, network, address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'withdraw', amount, coin, network, address],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.all('SELECT id, email, balance, kyc_status, win_rate FROM users', (err, users) => {
        res.json(users);
    });
});

app.get('/api/admin/transactions', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.all(`SELECT t.*, u.email FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`, (err, transactions) => {
        res.json(transactions);
    });
});

app.post('/api/admin/update-balance', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { userId, amount } = req.body;
    db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId], (err) => {
        res.json({ success: true });
    });
});

app.post('/api/admin/update-win-rate', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { userId, winRate } = req.body;
    db.run('UPDATE users SET win_rate = ? WHERE id = ?', [winRate, userId], (err) => {
        res.json({ success: true });
    });
});

app.post('/api/admin/approve-kyc', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { userId, status } = req.body;
    db.run('UPDATE users SET kyc_status = ? WHERE id = ?', [status, userId], (err) => {
        res.json({ success: true });
    });
});

app.post('/api/kyc/submit', authenticateToken, (req: any, res) => {
    db.run('UPDATE users SET kyc_status = "pending" WHERE id = ?', [req.user.id], (err) => {
        res.json({ success: true });
    });
});

app.post('/api/admin/approve-transaction', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id, status } = req.body;
    db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, tx: any) => {
        if (status === 'approved' && tx.type === 'deposit') {
            db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [tx.amount, tx.user_id]);
        }
        db.run('UPDATE transactions SET status = ? WHERE id = ?', [status, id], (err) => {
            res.json({ success: true });
        });
    });
});

async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static(path.join(__dirname, 'dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
