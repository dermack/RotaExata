import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRATION = '30m';

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return sendError(res, 400, 'Email e senha são obrigatórios');
    }

    if (!isValidEmail(email)) {
      return sendError(res, 400, 'Email inválido');
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return sendError(res, 400, 'Usuário já existe');
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, hash);

    return res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return sendError(res, 400, 'Email e senha são obrigatórios');
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}