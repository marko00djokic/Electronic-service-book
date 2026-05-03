import { join } from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { migration001 } from './migrations/001_initial.js'

// Svi registrovani migracije u redoslijedu izvršavanja
const MIGRATIONS = [
  { id: 1, name: '001_initial', run: migration001 }
]

let db = null

export function initDatabase() {
  const dbPath = join(app.getPath('userData'), 'esb.db')
  db = new Database(dbPath)

  // WAL mod za bolji concurrent pristup, foreign keys za integritet
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()

  return db
}

export function getDatabase() {
  if (!db) throw new Error('Baza nije inicijalizovana — pozovi initDatabase() prvo')
  return db
}

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  for (const migration of MIGRATIONS) {
    const applied = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migration.name)
    if (!applied) {
      const runInTransaction = db.transaction(() => {
        migration.run(db)
        db.prepare('INSERT INTO migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name)
      })
      runInTransaction()
      console.log(`Migracija ${migration.name} primijenjena`)
    }
  }
}
