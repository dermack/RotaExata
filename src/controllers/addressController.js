import jwt from 'jsonwebtoken';
import { create, update, remove, findByUser, findById, createAddressLog } from '../repositories/addressRepository.js';

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function getAuthenticatedUserId(req) {
  return req.user?.id ?? null;
}

function isJwtError(error) {
  return ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error?.name);
}

export async function createAddress(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Não autenticado');
    }

    const { street, city, state, zip } = req.body;

    if (!street || !city || !state || !zip) {
      return sendError(res, 400, 'street, city, state e zip são obrigatórios');
    }

    const address = await create({
      user_id: userId,
      street,
      city,
      state,
      zip
    });

    return res.status(201).json(address);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function getAddresses(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Não autenticado');
    }

    const search = req.query.search || null;
    const addresses = await findByUser(userId, search);

    return res.json({ message: 'getAddresses', addresses });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function updateAddress(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Não autenticado');
    }

    const { id } = req.params;

    const address = await findById(id);

    if (!address) {
      return sendError(res, 404, 'Endereço não encontrado');
    }

    if (address.user_id !== userId) {
      return sendError(res, 403, 'Acesso negado');
    }

    const updated = await update(id, userId, req.body);

    if (!updated) {
      return sendError(res, 404, 'Endereço não encontrado');
    }

    await createAddressLog({
      address_id: id,
      user_id: userId,
      action: 'UPDATE',
      old_data: address,
      new_data: updated
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function deleteAddress(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Não autenticado');
    }

    const { id } = req.params;
    const address = await findById(id);

    if (!address) {
      return sendError(res, 404, 'Endereço não encontrado');
    }

    if (address.user_id !== userId) {
      return sendError(res, 403, 'Acesso negado');
    }

    await remove(id);

    await createAddressLog({
      address_id: id,
      user_id: userId,
      action: 'DELETE',
      old_data: address,
      new_data: null
    });

    return res.json({ message: 'Endereço removido com sucesso' });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function shareAddress(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Não autenticado');
    }

    const { id } = req.params;
    const { expiresIn } = req.body;

    const address = await findById(id);

    if (!address) {
      return sendError(res, 404, 'Endereço não encontrado');
    }

    if (address.user_id !== userId) {
      return sendError(res, 403, 'Acesso negado');
    }

    const token = jwt.sign(
      { address_id: id },
      process.env.JWT_SECRET,
      { expiresIn: expiresIn || '1h' }
    );

    const url = `http://localhost:3000/shared/${token}`;

    return res.json({ url });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Erro interno');
  }
}

export async function getSharedAddress(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return sendError(res, 401, 'Token não informado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const address = await findById(decoded.address_id);

    if (!address) {
      return sendError(res, 404, 'Endereço não encontrado');
    }

    return res.json(address);
  } catch (error) {
    console.error(error);

    if (error?.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expirado');
    }

    if (isJwtError(error)) {
      return sendError(res, 401, 'Token inválido');
    }

    return sendError(res, 500, 'Erro interno');
  }
}
