const express = require('express');
const router = express.Router();
const { Exam } = require('../models/Exam');
const anthropic = require('../config/claude');

// Criar prova manualmente
router.post('/create-manual', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    
    const exam = new Exam({
      title,
      description,
      questions,
      createdBy: 'Professor'
    });
    
    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gerar prova com IA
router.post('/generate-ai', async (req, res) => {
  try {
    const { topic, summaries, questionCount } = req.body;
    
    // Validações
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Tema da prova é obrigatório' });
    }
    
    if (questionCount < 1 || questionCount > 20) {
      return res.status(400).json({ success: false, error: 'Quantidade de questões deve ser entre 1 e 20' });
    }
    
    if (summaries && summaries.length > 5) {
      return res.status(400).json({ success: false, error: 'Máximo de 5 resumos permitidos' });
    }
    
    // Validar tamanho total dos resumos
    if (summaries) {
      const totalChars = summaries.reduce((sum, summary) => sum + (summary ? summary.length : 0), 0);
      if (totalChars > 100000) {
        return res.status(400).json({ 
          success: false, 
          error: `Total de caracteres dos resumos (${totalChars.toLocaleString()}) excede o limite de 100.000 caracteres` 
        });
      }
    }
    
    // Gerar questões usando Claude
    const questions = await generateQuestionsWithClaude(topic, summaries, questionCount);
    
    const exam = new Exam({
      title: `Prova sobre ${topic}`,
      description: `Prova gerada automaticamente sobre o tema: ${topic}`,
      questions,
      createdBy: 'Claude AI'
    });
    
    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Erro ao gerar prova com Claude:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar todas as provas
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().select('-questions.correctAnswer');
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter prova específica (sem respostas corretas)
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).select('-questions.correctAnswer');
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Prova não encontrada' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter gabarito da prova
router.get('/:id/answer-key', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Prova não encontrada' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função auxiliar para gerar questões com Claude
async function generateQuestionsWithClaude(topic, summaries, questionCount) {
  try {
    // Preparar contexto com resumos se fornecidos
    let context = `Tema da prova: ${topic}\n\n`;
    if (summaries && summaries.length > 0) {
      context += `Contexto adicional:\n`;
      summaries.forEach((summary, index) => {
        if (summary.trim()) {
          context += `${index + 1}. ${summary.trim()}\n`;
        }
      });
    }

    const prompt = `${context}

Crie ${questionCount} questões para uma prova sobre "${topic}". 

INSTRUÇÕES IMPORTANTES:
1. Misture questões objetivas (70%) e dissertativas (30%)
2. Para questões objetivas: forneça 4 opções (A, B, C, D) e indique a resposta correta
3. Para questões dissertativas: forneça uma resposta modelo
4. Use pontos variados: 1 ponto para objetivas simples, 2 pontos para dissertativas
5. Faça questões de diferentes níveis de dificuldade
6. Seja específico e educativo

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "type": "objective",
      "question": "Enunciado da questão",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": "Opção A",
      "points": 1
    },
    {
      "type": "essay", 
      "question": "Enunciado da questão dissertativa",
      "correctAnswer": "Resposta modelo detalhada",
      "points": 2
    }
  ]
}

Responda APENAS com o JSON válido, sem texto adicional.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const content = response.content[0].text;
    
    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da Claude não contém JSON válido');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    return parsedResponse.questions;

  } catch (error) {
    console.error('Erro ao gerar questões com Claude:', error);
    
    // Fallback: gerar questões básicas se Claude falhar
    return generateFallbackQuestions(topic, questionCount);
  }
}

// Função de fallback caso a Claude falhe
function generateFallbackQuestions(topic, questionCount) {
  const questions = [];
  
  for (let i = 0; i < questionCount; i++) {
    const isObjective = Math.random() > 0.3; // 70% objetivas, 30% dissertativas
    
    if (isObjective) {
      questions.push({
        type: 'objective',
        question: `Questão ${i + 1}: Qual é uma característica importante sobre ${topic}?`,
        options: [
          `Opção A sobre ${topic}`,
          `Opção B sobre ${topic}`,
          `Opção C sobre ${topic}`,
          `Opção D sobre ${topic}`
        ],
        correctAnswer: `Opção A sobre ${topic}`,
        points: 1
      });
    } else {
      questions.push({
        type: 'essay',
        question: `Questão ${i + 1}: Explique detalhadamente sobre ${topic} e sua importância.`,
        correctAnswer: `Resposta modelo sobre ${topic}`,
        points: 2
      });
    }
  }
  
  return questions;
}

router.delete('/:id', async (req, res) => {
  try {
    const { Correction } = require('../models/Exam');
    
    // Atualizar correções para remover referência quebrada
    await Correction.updateMany(
      { examId: req.params.id },
      { $set: { examId: null } }  // Remove a referência
    );
    
    // Deletar a prova
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
