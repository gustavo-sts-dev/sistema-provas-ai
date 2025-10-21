import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';

const CreateExam = () => {
  const navigate = useNavigate();
  const [examType, setExamType] = useState('manual');
  const [loading, setLoading] = useState(false);
  
  // Estados para criação manual
  const [manualExam, setManualExam] = useState({
    title: '',
    description: '',
    questions: []
  });
  
  // Estados para geração com IA
  const [aiExam, setAiExam] = useState({
    topic: '',
    summaries: [''],
    questionCount: 5
  });

  const [uploadingPdf, setUploadingPdf] = useState(false);

  const addQuestion = () => {
    setManualExam({
      ...manualExam,
      questions: [...manualExam.questions, {
        type: 'objective',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...manualExam.questions];
    updatedQuestions[index][field] = value;
    setManualExam({ ...manualExam, questions: updatedQuestions });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...manualExam.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setManualExam({ ...manualExam, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = manualExam.questions.filter((_, i) => i !== index);
    setManualExam({ ...manualExam, questions: updatedQuestions });
  };

  const addSummary = () => {
    if (aiExam.summaries.length >= 5) {
      alert('Máximo de 5 resumos permitidos.');
      return;
    }
    setAiExam({
      ...aiExam,
      summaries: [...aiExam.summaries, '']
    });
  };

  const updateSummary = (index, value) => {
    const updatedSummaries = [...aiExam.summaries];
    updatedSummaries[index] = value;
    
    // Calcular total de caracteres
    const totalChars = updatedSummaries.reduce((sum, summary) => sum + summary.length, 0);
    
    // Verificar se excede o limite total de 100.000 caracteres
    if (totalChars > 100000) {
      alert('Limite total de 100.000 caracteres excedido. Remova alguns caracteres para continuar.');
      return;
    }
    
    setAiExam({ ...aiExam, summaries: updatedSummaries });
  };

  const removeSummary = (index) => {
    const updatedSummaries = aiExam.summaries.filter((_, i) => i !== index);
    setAiExam({ ...aiExam, summaries: updatedSummaries });
  };

  const handlePdfUpload = async (event, summaryIndex) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('O arquivo PDF deve ter no máximo 10MB.');
      return;
    }

    // Verificar se há espaço disponível no limite total
    const currentTotal = aiExam.summaries.reduce((sum, summary) => sum + summary.length, 0);
    if (currentTotal >= 100000) {
      alert('Limite total de 100.000 caracteres já atingido. Remova alguns caracteres antes de adicionar mais texto.');
      return;
    }

    setUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await axios.post(api.extractPDF(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const extractedText = response.data.text;
        const updatedSummaries = [...aiExam.summaries];
        
        // Calcular o novo total se adicionarmos este texto
        const currentTotal = updatedSummaries.reduce((sum, summary, index) => {
          if (index === summaryIndex) return sum; // Não contar o resumo atual
          return sum + summary.length;
        }, 0);
        
        const newTotal = currentTotal + extractedText.length;
        
        if (newTotal > 100000) {
          alert(`O texto extraído (${extractedText.length.toLocaleString()} caracteres) excederia o limite total de 100.000 caracteres. Espaço disponível: ${(100000 - currentTotal).toLocaleString()} caracteres.`);
          return;
        }
        
        updatedSummaries[summaryIndex] = extractedText;
        setAiExam({ ...aiExam, summaries: updatedSummaries });
        alert(`Texto extraído com sucesso! (${response.data.pages} páginas, ${extractedText.length.toLocaleString()} caracteres)`);
      } else {
        alert('Erro ao extrair texto do PDF.');
      }
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      alert('Erro ao processar o arquivo PDF.');
    } finally {
      setUploadingPdf(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (examType === 'manual') {
        await axios.post(api.createManualExam(), manualExam);
      } else {
        await axios.post(api.generateAIExam(), aiExam);
      }
      
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar prova:', error);
      alert('Erro ao criar prova. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Criar Nova Prova
      </h1>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={() => setExamType('manual')}
            className={`px-4 py-2 rounded-md transition-colors text-sm sm:text-base ${
              examType === 'manual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Criação Manual
          </button>
          <button
            onClick={() => setExamType('ai')}
            className={`px-4 py-2 rounded-md transition-colors text-sm sm:text-base ${
              examType === 'ai'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Geração com IA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {examType === 'manual' ? (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Prova
                </label>
                <input
                  type="text"
                  value={manualExam.title}
                  onChange={(e) => setManualExam({ ...manualExam, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={manualExam.description}
                  onChange={(e) => setManualExam({ ...manualExam, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Questões
                  </h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Adicionar Questão
                  </button>
                </div>

                {manualExam.questions.map((question, index) => (
                  <div key={index} className="border border-gray-300 rounded-md p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">
                        Questão {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Questão
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="objective">Objetiva</option>
                        <option value="essay">Dissertativa</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enunciado da Questão
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        required
                      />
                    </div>

                    {question.type === 'objective' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opções de Resposta
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <input
                            key={optionIndex}
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            placeholder={`Opção ${String.fromCharCode(65 + optionIndex)}`}
                            required
                          />
                        ))}
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resposta Correta
                      </label>
                      {question.type === 'objective' ? (
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Selecione a resposta correta</option>
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {String.fromCharCode(65 + optionIndex)} - {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Resposta modelo para questão dissertativa"
                          required
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pontos
                      </label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema da Prova
                </label>
                <input
                  type="text"
                  value={aiExam.topic}
                  onChange={(e) => setAiExam({ ...aiExam, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: História do Brasil, Matemática Básica, etc."
                  required
                />
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                  <div className="mb-2 sm:mb-0">
                    <label className="block text-sm font-medium text-gray-700">
                      Resumos (Opcional)
                    </label>
                    <p className="text-xs text-gray-500">
                      Máximo 5 resumos, 100.000 caracteres no total
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSummary}
                    disabled={aiExam.summaries.length >= 5}
                    className={`px-3 py-1 rounded-md transition-colors text-sm ${
                      aiExam.summaries.length >= 5
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {aiExam.summaries.length >= 5 ? 'Máximo atingido' : 'Adicionar Resumo'}
                  </button>
                </div>
                
                {/* Contador total de caracteres */}
                {aiExam.summaries.some(s => s.length > 0) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className={`text-sm font-medium ${
                      aiExam.summaries.reduce((sum, s) => sum + s.length, 0) > 90000 ? 'text-red-600' : 
                      aiExam.summaries.reduce((sum, s) => sum + s.length, 0) > 70000 ? 'text-yellow-600' : 
                      'text-gray-700'
                    }`}>
                      Total de caracteres: {aiExam.summaries.reduce((sum, s) => sum + s.length, 0).toLocaleString()}/100.000
                      {aiExam.summaries.reduce((sum, s) => sum + s.length, 0) > 90000 && ' ⚠️ Próximo do limite total'}
                    </div>
                  </div>
                )}
                
                {aiExam.summaries.map((summary, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex flex-col sm:flex-row mb-2">
                      <textarea
                        value={summary}
                        onChange={(e) => updateSummary(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
                        rows="3"
                        placeholder="Cole aqui um resumo ou texto sobre o tema..."
                      />
                      <div className="sm:ml-2 flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-1">
                        <label className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md cursor-pointer transition-colors text-sm whitespace-nowrap">
                          {uploadingPdf ? 'Processando...' : 'Extrair PDF'}
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handlePdfUpload(e, index)}
                            className="hidden"
                            disabled={uploadingPdf}
                          />
                        </label>
                        {aiExam.summaries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSummary(index)}
                            className="text-red-500 hover:text-red-700 text-sm whitespace-nowrap"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                    {summary && (
                      <div className="text-xs text-gray-500">
                        Caracteres: {summary.length.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Questões (máximo 20)
                </label>
                <input
                  type="number"
                  value={aiExam.questionCount}
                  onChange={(e) => setAiExam({ ...aiExam, questionCount: parseInt(e.target.value) })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Criando...' : 'Criar Prova'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
