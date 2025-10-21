const Password = require('../models/Password');

const authenticateUser = async (req, res, next) => {
  try {
    const { password } = req.body;

    console.log('🔐 Tentativa de login recebida');
    console.log('📝 Senha fornecida:', password ? '***' : 'não fornecida');

    if (!password) {
      console.log('❌ Senha não fornecida');
      return res.status(400).json({ 
        success: false, 
        error: 'Senha é obrigatória' 
      });
    }

    // Verificar conexão com MongoDB
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB não conectado. Estado:', mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false, 
        error: 'Banco de dados não disponível' 
      });
    }

    console.log('✅ MongoDB conectado, buscando senha...');

    // Buscar a senha no banco de dados
    const passwordDoc = await Password.findOne().sort({ createdAt: -1 });
    
    console.log('🔍 Senha encontrada no banco:', passwordDoc ? 'Sim' : 'Não');
    
    if (!passwordDoc) {
      console.log('❌ Nenhuma senha configurada no sistema');
      return res.status(500).json({ 
        success: false, 
        error: 'Sistema não configurado. Contate o administrador.' 
      });
    }

    // Verificar se a senha está correta
    const isPasswordCorrect = password === passwordDoc.password;
    console.log('🔐 Senha correta:', isPasswordCorrect ? 'Sim' : 'Não');

    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false, 
        error: 'Senha incorreta' 
      });
    }

    console.log('✅ Login autorizado');
    // Senha correta, continuar
    next();
  } catch (error) {
    console.error('💥 Erro na autenticação:', error);
    console.error('📊 Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

module.exports = authenticateUser;
