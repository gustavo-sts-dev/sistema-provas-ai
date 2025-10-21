const express = require('express');
const authenticateUser = require('../middleware/auth');
const Password = require('../models/Password');
const router = express.Router();

// Rota para fazer login
router.post('/login', authenticateUser, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Login realizado com sucesso' 
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para verificar se existe senha configurada
router.get('/check-password', async (req, res) => {
  try {
    const passwordDoc = await Password.findOne().sort({ createdAt: -1 });
    
    if (passwordDoc) {
      res.json({ 
        success: true, 
        hasPassword: true,
        createdAt: passwordDoc.createdAt
      });
    } else {
      res.json({ 
        success: true, 
        hasPassword: false 
      });
    }
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para configurar senha inicial (apenas se não existir)
router.post('/setup-password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se já existe senha
    const existingPassword = await Password.findOne().sort({ createdAt: -1 });
    
    if (existingPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha já configurada. Use a rota de login.'
      });
    }

    // Criar nova senha
    const newPassword = new Password({ password });
    await newPassword.save();

    console.log('✅ Senha inicial configurada com sucesso');
    
    res.json({
      success: true,
      message: 'Senha configurada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao configurar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
