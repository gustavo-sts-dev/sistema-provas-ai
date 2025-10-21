const express = require('express');
const router = express.Router();
const { StudentAnswer, Correction, Exam } = require('../models/Exam');

// Correção automática com IA
router.post('/automatic', async (req, res) => {
  try {
    const { studentAnswerId, evaluatorName } = req.body;
    
    const studentAnswer = await StudentAnswer.findById(studentAnswerId)
      .populate('examId');
    
    if (!studentAnswer) {
      return res.status(404).json({ success: false, error: 'Resposta não encontrada' });
    }
    
    const exam = studentAnswer.examId;
    const corrections = [];
    let totalScore = 0;
    let maxScore = 0;
    
    for (let i = 0; i < exam.questions.length; i++) {
      const question = exam.questions[i];
      const studentAnswerText = studentAnswer.answers.find(a => 
        a.questionId.toString() === question._id.toString()
      )?.answer || '';
      
      maxScore += question.points;
      
      let points = 0;
      let feedback = '';
      
      if (question.type === 'objective') {
        // Correção automática para questões objetivas
        if (studentAnswerText === question.correctAnswer) {
          points = question.points;
          feedback = 'Resposta correta!';
        } else {
          feedback = 'Resposta incorreta.';
        }
      } else {
        // Simulação de correção com IA para questões dissertativas
        points = Math.floor(Math.random() * question.points) + 0.5; // Simulação
        feedback = `Resposta parcialmente correta. Pontos: ${points}/${question.points}`;
      }
      
      totalScore += points;
      
      corrections.push({
        questionId: question._id,
        studentAnswer: studentAnswerText,
        correctAnswer: question.correctAnswer,
        questionType: question.type,
        points,
        feedback
      });
    }
    
    const correction = new Correction({
  studentAnswerId,
  examId: exam._id,
  examTitle: exam.title,
  examDescription: exam.description,
  studentName: studentAnswer.studentName,
      answers: corrections,
      totalScore,
      maxScore,
      correctedBy: evaluatorName,
      correctionMethod: 'automatic'
    });
    
    await correction.save();
    
    // Atualizar status da resposta do aluno
    studentAnswer.status = 'corrected';
    await studentAnswer.save();
    
    res.json({ success: true, correction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Correção manual
router.post('/manual', async (req, res) => {
  try {
    const { studentAnswerId, evaluatorName, corrections } = req.body;
    
    const studentAnswer = await StudentAnswer.findById(studentAnswerId)
      .populate('examId');
    
    if (!studentAnswer) {
      return res.status(404).json({ success: false, error: 'Resposta não encontrada' });
    }
    
    const exam = studentAnswer.examId;
    let totalScore = 0;
    let maxScore = 0;
    
    // Calcular pontuação total
    exam.questions.forEach(question => {
      maxScore += question.points;
    });
    
    corrections.forEach(correction => {
      totalScore += correction.points;
    });
    
    const correction = new Correction({
  studentAnswerId,
  examId: exam._id,
  examTitle: exam.title,
  examDescription: exam.description,
  studentName: studentAnswer.studentName,
      answers: corrections,
      totalScore,
      maxScore,
      correctedBy: evaluatorName,
      correctionMethod: 'manual'
    });
    
    await correction.save();
    
    // Atualizar status da resposta do aluno
    studentAnswer.status = 'corrected';
    await studentAnswer.save();
    
    res.json({ success: true, correction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar provas corrigidas
router.get('/corrected', async (req, res) => {
  try {
    const corrections = await Correction.find()
      .populate('examId', 'title description')
      .sort({ correctedAt: -1 });
    res.json({ success: true, corrections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter correção específica
router.get('/:id', async (req, res) => {
  try {
    const correction = await Correction.findById(req.params.id)
      .populate('examId')
      .populate('studentAnswerId');
    if (!correction) {
      return res.status(404).json({ success: false, error: 'Correção não encontrada' });
    }
    res.json({ success: true, correction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar correção
router.delete('/:id', async (req, res) => {
  try {
    const { Correction } = require('../models/Exam');
    await Correction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
