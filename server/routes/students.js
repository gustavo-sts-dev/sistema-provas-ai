const express = require('express');
const router = express.Router();
const { StudentAnswer } = require('../models/Exam');

// Submeter respostas da prova
router.post('/submit', async (req, res) => {
  try {
    const { examId, studentName, answers } = req.body;
    
    const studentAnswer = new StudentAnswer({
      examId,
      studentName,
      answers,
      status: 'pending'
    });
    
    await studentAnswer.save();
    res.json({ success: true, studentAnswer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar provas realizadas pendentes de correção
router.get('/pending', async (req, res) => {
  try {
    const pendingAnswers = await StudentAnswer.find({ status: 'pending' })
      .populate('examId', 'title description createdAt');
    res.json({ success: true, pendingAnswers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter respostas específicas de um aluno
router.get('/:id', async (req, res) => {
  try {
    const studentAnswer = await StudentAnswer.findById(req.params.id)
      .populate('examId');
    if (!studentAnswer) {
      return res.status(404).json({ success: false, error: 'Resposta não encontrada' });
    }
    res.json({ success: true, studentAnswer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar prova pendente
router.delete('/pending/:id', async (req, res) => {
  try {
    await StudentAnswer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
