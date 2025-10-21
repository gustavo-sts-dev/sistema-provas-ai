const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['objective', 'essay'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String], // Para questões objetivas
  correctAnswer: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 1
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'Sistema'
  }
});

const studentAnswerSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String,
    questionType: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'corrected'],
    default: 'pending'
  }
});

const correctionSchema = new mongoose.Schema({
  studentAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentAnswer',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examTitle: {
    type: String,
    required: true
  },
  examDescription: String,
  studentName: {
    type: String,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    studentAnswer: String,
    correctAnswer: String,
    questionType: String,
    points: Number,
    feedback: String
  }],
  totalScore: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  correctedBy: {
    type: String,
    required: true
  },
  correctedAt: {
    type: Date,
    default: Date.now
  },
  correctionMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true
  }
});

module.exports = {
  Exam: mongoose.model('Exam', examSchema),
  StudentAnswer: mongoose.model('StudentAnswer', studentAnswerSchema),
  Correction: mongoose.model('Correction', correctionSchema)
};
