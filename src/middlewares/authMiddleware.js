import jwt from 'jsonwebtoken';

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, 401, 'Token não informado');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'Token inválido');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return sendError(res, 401, 'Token inválido');
    }

    req.user = { id: decoded.id };
    return next();
  } catch {
    return sendError(res, 401, 'Token inválido');
  }
}