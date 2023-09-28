import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('database.db');

// Crear una tabla de usuarios si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);
});

export function insertUsuario(name, email, password) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)');
    stmt.run(name, email, password, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    stmt.finalize();
  });
}

export function findUsuarioByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM usuarios WHERE email = ?', email, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function findUsuarioByEmailAndPassword(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Más funciones para gestionar la base de datos según sea necesario

export default db;
