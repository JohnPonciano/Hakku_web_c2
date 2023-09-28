import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign({ name: user.name, email: user.email }, SECRET);
}

export function readToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new Error('token_invalido');
  }
}

export function verifica(token) {
  return readToken(token)
}