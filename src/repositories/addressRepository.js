import { pool } from '../config/db.js';

function stringifyValue(value) {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

/* Cria registro de endereço */
export async function create(data) {
  const { user_id, street, city, state, zip } = data;

  const result = await pool.query(
    `INSERT INTO addresses (user_id, street, city, state, zip)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, street, city, state, zip, created_at`,
    [user_id, street, city, state, zip]
  );

  return result.rows[0];
}


/* Busca todos os endereços de um usuário, com filtro opcional */
export async function findByUser(userId, search) {
  const params = [userId];
  let query = `SELECT id, user_id, street, city, state, zip, created_at
               FROM addresses
               WHERE user_id = $1`;

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (street ILIKE $2 OR city ILIKE $2 OR state ILIKE $2 OR zip ILIKE $2)`;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}


/* Busca endereço por ID */
export async function findById(id) {
  const result = await pool.query(
    `SELECT id, user_id, street, city, state, zip, created_at
     FROM addresses
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
}


/* Só atualiza os campos que foram passados no body */
export async function update(id, userId, data) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);
  values.push(userId);

  const query = `
    UPDATE addresses
    SET ${fields.join(', ')}
    WHERE id = $${index} AND user_id = $${index + 1}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  return result.rows[0];
}


/* Remove endereço por ID */
export async function remove(id) {
  await pool.query(`DELETE FROM addresses WHERE id = $1`, [id]);
}


/* Cria log de alterações do endereço */
export async function createAddressLog(data) {
  const { address_id, user_id, action, old_data, new_data } = data;

  const result = await pool.query(
    `INSERT INTO logs (address_id, user_id, action, old_data, new_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, address_id, user_id, action, old_data, new_data, created_at`,
    [address_id, user_id, action, stringifyValue(old_data), stringifyValue(new_data)]
  );

  return result.rows[0];
}