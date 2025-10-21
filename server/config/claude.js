const Anthropic = require('@anthropic-ai/sdk');

// Inicializar cliente Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sua-chave-api-aqui',
});

module.exports = anthropic;
