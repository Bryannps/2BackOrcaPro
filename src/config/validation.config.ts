/**
 * Configuração de validação global para variáveis de ambiente
 * Garante que todas as variáveis necessárias estejam presentes
 */

export const getConfig = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'fernanda@10',
    database: process.env.DB_DATABASE || 'orcapro',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-development',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});