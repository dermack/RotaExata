import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './config/db.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

start();