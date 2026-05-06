'use strict'

require('dotenv').config()

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const syncRoutes = require('./src/routes/sync')
const vehiclesRoutes = require('./src/routes/vehicles')
const serviceOrdersRoutes = require('./src/routes/serviceOrders')

const app = express()

app.use(helmet())

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(express.json({ limit: '5mb' }))

app.get('/ESK/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

app.use('/ESK/api/sync', syncRoutes)
app.use('/ESK/api/vehicles', vehiclesRoutes)
app.use('/ESK/api/service-orders', serviceOrdersRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000

if (require.main === module) {
  app.listen(PORT, () => console.log(`ESB API pokrenut na portu ${PORT}`))
}

// Passenger zahteva module.exports = app
module.exports = app
