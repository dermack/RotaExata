import jwt from 'jsonwebtoken';

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default function addressMiddleware(req, res, next) {
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
  } catch {
    return sendError(res, 401, 'Token inválido');
  }

  if (['POST', 'PUT'].includes(req.method) && (!req.body || Object.keys(req.body).length === 0)) {
    return sendError(res, 400, 'Dados do endereço obrigatórios');
  }

  return next();
}
