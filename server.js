const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'tuga_gizli_anahtar_2026';

app.use(cors());
app.use(express.json());

// Public klasöründen static servis (index.html vb. buradan sunulur)
app.use(express.static(path.join(__dirname, 'public')));

// VERİTABANI İŞLEMLERİ
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Veritabanı hatası:', err);
    else console.log('SQLite Veritabanı Bağlandı.');
});

db.serialize(() => {
    // 1. Kullanıcılar Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        lastLogin TEXT
    )`);

    // Eski tablo yapısı varsa eksik sütunları güvenle ekle
    db.run("ALTER TABLE users ADD COLUMN role TEXT", () => {});
    db.run("ALTER TABLE users ADD COLUMN lastLogin TEXT", () => {});

    // 2. Etkinlikler Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        link TEXT,
        startDate TEXT,
        endDate TEXT
    )`);

    // Eski admin hesabını temizle
    db.run("DELETE FROM users WHERE username = 'admin'");

    // Varsayılan Korumalı Geliştirici Admin (ygttdev)
    const defaultUsername = 'ygttdev';
    const defaultPass = 'P6+R,+fHx#z#WzX-jB75}O=`$1;Cc<p_';

    db.get("SELECT * FROM users WHERE username = ?", [defaultUsername], (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync(defaultPass, 10);
            db.run("INSERT INTO users (username, password, role, lastLogin) VALUES (?, ?, ?, ?)", 
                   [defaultUsername, hash, 'developer', 'Henüz Giriş Yapmadı']);
            console.log(`Varsayılan Geliştirici Admin Oluşturuldu: ${defaultUsername}`);
        }
    });
});

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Erişim engellendi.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Geçersiz token.' });
        req.user = user;
        next();
    });
};

const requireDeveloper = (req, res, next) => {
    if (req.user.role !== 'developer') {
        return res.status(403).json({ error: 'Bu işlem için Geliştirici yetkisi gereklidir.' });
    }
    next();
};

// --- ROTALAR ---

// Ana Sayfa Yönlendirmesi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Korumalı Admin Paneli Yönlendirmesi
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// 1. Admin Giriş
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        const validPass = bcrypt.compareSync(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        // Türkçe formatında son görülme tarihi
        const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
        db.run("UPDATE users SET lastLogin = ? WHERE id = ?", [now, user.id]);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username, role: user.role });
    });
});

// 2. TÜM KULLANICILARI GETİR (Sadece Geliştirici)
app.get('/api/users', authenticateToken, requireDeveloper, (req, res) => {
    db.all("SELECT id, username, role, lastLogin FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. YENİ KULLANICI EKLE (Sadece Geliştirici)
app.post('/api/users', authenticateToken, requireDeveloper, (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Eksik bilgi.' });

    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (username, password, role, lastLogin) VALUES (?, ?, ?, ?)", 
        [username, hash, role, 'Henüz Giriş Yapmadı'], 
        function(err) {
            if (err) return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
            res.json({ message: 'Kullanıcı oluşturuldu.' });
        }
    );
});

// 4. KULLANICI DÜZENLE (Sadece Geliştirici)
app.put('/api/users/:id', authenticateToken, requireDeveloper, (req, res) => {
    const { username, password, role } = req.body;

    db.get("SELECT username FROM users WHERE id = ?", [req.params.id], (err, user) => {
        if (user && user.username === 'ygttdev' && username !== 'ygttdev') {
            return res.status(403).json({ error: 'Ana geliştirici kullanıcı adı değiştirilemez.' });
        }

        if (password && password.trim() !== "") {
            const hash = bcrypt.hashSync(password, 10);
            db.run("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?", 
                [username, hash, role, req.params.id], 
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Kullanıcı güncellendi.' });
                }
            );
        } else {
            db.run("UPDATE users SET username = ?, role = ? WHERE id = ?", 
                [username, role, req.params.id], 
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Kullanıcı güncellendi.' });
                }
            );
        }
    });
});

// 5. KULLANICI SİL (ygttdev Korumalı)
app.delete('/api/users/:id', authenticateToken, requireDeveloper, (req, res) => {
    db.get("SELECT username FROM users WHERE id = ?", [req.params.id], (err, user) => {
        if (user && user.username === 'ygttdev') {
            return res.status(403).json({ error: 'Varsayılan ana geliştirici hesabı (ygttdev) silinemez!' });
        }

        db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Kullanıcı silindi.' });
        });
    });
});

// --- ETKİNLİK ENDPOINT'LERİ ---
app.get('/api/events', (req, res) => {
    db.all("SELECT * FROM events ORDER BY startDate ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/events', authenticateToken, (req, res) => {
    const { title, description, link, startDate, endDate } = req.body;
    db.run("INSERT INTO events (title, description, link, startDate, endDate) VALUES (?, ?, ?, ?, ?)",
        [title, description, link, startDate, endDate],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Etkinlik eklendi.' });
        }
    );
});

app.put('/api/events/:id', authenticateToken, (req, res) => {
    const { title, description, link, startDate, endDate } = req.body;
    db.run("UPDATE events SET title = ?, description = ?, link = ?, startDate = ?, endDate = ? WHERE id = ?",
        [title, description, link, startDate, endDate, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Etkinlik güncellendi.' });
        }
    );
});

app.delete('/api/events/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM events WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Etkinlik silindi.' });
    });
});

app.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor.`));