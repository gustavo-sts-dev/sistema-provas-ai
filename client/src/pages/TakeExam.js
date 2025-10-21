import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const response = await axios.get(api.getExam(id));
      setExam(response.data.exam);
      
      // Inicializar respostas vazias
      const initialAnswers = response.data.exam.questions.map(question => ({
        questionId: question._id,
        answer: '',
        questionType: question.type
      }));
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Erro ao carregar prova:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (questionIndex, answer) => {
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex].answer = answer;
    setAnswers(updatedAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      alert('Por favor, informe seu nome antes de finalizar a prova.');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(api.submitExam(), {
        examId: id,
        studentName: studentName.trim(),
        answers
      });
      
      alert('Prova enviada com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao enviar prova:', error);
      alert('Erro ao enviar prova. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando prova...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg">Prova não encontrada.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          {exam.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">{exam.description}</p>
        
        <div className="text-xs sm:text-sm text-gray-500 mb-6">
          Criada em: {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
        </div>

        <form onSubmit={handleSubmit}>
          {exam.questions.map((question, index) => (
            <div key={question._id} className="mb-6 sm:mb-8 p-3 sm:p-4 border border-gray-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                  Questão {index + 1}
                </h3>
                <span className="text-xs sm:text-sm text-gray-500">
                  {question.points} ponto{question.points > 1 ? 's' : ''}
                </span>
              </div>
              
              <p className="text-sm sm:text-base text-gray-700 mb-4">{question.question}</p>
              
              {question.type === 'objective' ? (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-start">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        onChange={(e) => updateAnswer(index, e.target.value)}
                        className="mr-3 mt-1"
                      />
                      <span className="text-sm sm:text-base text-gray-700">
                        {String.fromCharCode(65 + optionIndex)}) {option}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[index]?.answer || ''}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Digite sua resposta aqui..."
                />
              )}
            </div>
          ))}

          <div className="border-t pt-4 sm:pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu Nome *
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                {submitting ? 'Enviando...' : 'Finalizar Prova'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeExam;
