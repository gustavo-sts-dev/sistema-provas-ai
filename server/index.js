const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/environment');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Conectar ao MongoDB
console.log('🔗 Tentando conectar ao MongoDB...');
console.log('📊 Configuração:', {
  environment: config.environment,
  port: config.port,
  mongodb: config.mongodb ? 'Configurado' : 'Não configurado',
  cors: config.cors.origin
});

mongoose.connect(config.mongodb)
.then(() => {
  console.log('✅ Conectado ao MongoDB com sucesso!');
  console.log(`📊 Ambiente: ${config.environment.toUpperCase()}`);
  console.log(`🚀 Porta: ${config.port}`);
  console.log(`🗄️ MongoDB: ${config.mongodb}`);
  
  if (config.logging) {
    console.log('📝 Logging ativado');
  }
})
.catch(err => {
  console.error('❌ Erro ao conectar MongoDB:', err);
  console.error('📊 Detalhes do erro:', {
    message: err.message,
    name: err.name,
    code: err.code
  });
});

app.use(async (req, res, next) => {
  // Pula verificação para rotas que não precisam de banco
  if (req.path === '/' || req.path === '/favicon.ico') {
    return next();
  }

  // Aguarda conexão se ainda estiver conectando
  if (mongoose.connection.readyState !== 1) {
    console.log('⏳ Aguardando conexão MongoDB...');
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
        mongoose.connection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } catch (error) {
      console.error('❌ MongoDB não conectou a tempo');
      return res.status(503).json({ success: false, error: 'Banco de dados indisponível' });
    }
  }
  next();
});

// Importar rotas
const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const correctionRoutes = require('./routes/corrections');
const pdfRoutes = require('./routes/pdf');
const authRoutes = require('./routes/auth');

// Usar rotas
app.use('/api/exams', examRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/corrections', correctionRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/auth', authRoutes);

// Rota de teste com informações do ambiente
app.get('/', (req, res) => {
  const urls = config.getUrls();
  res.json({ 
    message: 'API do Sistema de Provas funcionando!',
    environment: config.environment,
    port: config.port,
    mongodb: config.mongodb,
    urls: urls,
    timestamp: new Date().toISOString(),
    features: {
      logging: config.logging,
      hotReload: config.hotReload
    }
  });
});

app.listen(config.port, () => {
  console.log(`Servidor rodando na porta ${config.port}`);
  console.log(`URLs disponíveis:`);
  console.log(`  API: http://localhost:${config.port}`);
  console.log(`  Frontend: http://localhost:3000`);
});
