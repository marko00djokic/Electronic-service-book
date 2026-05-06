'use strict'

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const pool = require('../db')

// Middleware za desktop app sync — proverava API ključ u headeru
async function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key) return res.status(401).json({ error: 'API ključ nije prosleđen' })

  try {
    const [rows] = await pool.query(
      'SELECT id, key_hash FROM api_keys WHERE is_active = TRUE'
    )
    const match = rows.find(r => bcrypt.compareSync(key, r.key_hash))
    if (!match) return res.status(403).json({ error: 'Nevažeći API ključ' })

    await pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?', [match.id])
    next()
  } catch (err) {
    console.error('Auth greška:', err)
    res.status(500).json({ error: 'Greška pri autentifikaciji' })
  }
}

// Middleware za web portal — proverava JWT token u Authorization headeru
function requireJwt(req, res, next) {
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'JWT token nije prosleđen' })
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(403).json({ error: 'Nevažeći ili istekao token' })
  }
}

// Generisanje JWT-a (koristi se pri logovanju vlasnika na web portal)
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { requireApiKey, requireJwt, generateToken }
