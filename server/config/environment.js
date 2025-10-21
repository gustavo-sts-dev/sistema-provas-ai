// Configurações baseadas no ambiente
const config = {
  development: {
    port: process.env.PORT || 5000,
    mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sistema-provas-dev',
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    },
    logging: true,
    hotReload: true
  },
  
  production: {
    port: process.env.PORT || 3000,
    mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sistema-provas-prod',
    cors: {
      origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['https://questions-front-seven.vercel.app'],
      credentials: true
    },
    logging: false,
    hotReload: false
  }
};

// Detectar ambiente
const environment = process.env.NODE_ENV || 'development';
const isDevelopment = environment === 'development';

// Validar variáveis de ambiente obrigatórias em produção
if (!isDevelopment) {
  const requiredEnvVars = ['MONGODB_URI'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

// Exportar configuração atual
module.exports = {
  ...config[environment],
  environment,
  isDevelopment,
  
  // URLs completas
  getUrls: () => ({
    api: isDevelopment 
      ? `http://localhost:${config[environment].port}` 
      : (process.env.API_URL || 'https://questions-back.vercel.app'),
    frontend: isDevelopment 
      ? 'http://localhost:3000' 
      : (process.env.FRONTEND_URL || 'https://questions-front-seven.vercel.app'),
    mongodb: config[environment].mongodb
  })
};