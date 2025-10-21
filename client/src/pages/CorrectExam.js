import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { api } from '../config/api';
import ItemActions from '../components/ItemActions';
import FolderBar from '../components/FolderBar';
import { itemMeta, getAvailableFolders } from '../utils/storage';

const CorrectExam = () => {
  const [pendingExams, setPendingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [correctingExam, setCorrectingExam] = useState(null);
  const [correctionMethod, setCorrectionMethod] = useState('automatic');
  const [evaluatorName, setEvaluatorName] = useState('');
  const [manualCorrections, setManualCorrections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeFolder, setActiveFolder] = useState('Sem pasta');

  useEffect(() => {
    fetchPendingExams();
  }, []);

  const fetchPendingExams = async () => {
    try {
      const response = await axios.get(api.getPendingExams());
      setPendingExams(response.data.pendingAnswers);
    } catch (error) {
      console.error('Erro ao carregar provas pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCorrection = (exam) => {
    setCorrectingExam(exam);
    
    // Inicializar correções manuais se necessário
    if (correctionMethod === 'manual') {
      const initialCorrections = exam.examId.questions.map(question => ({
        questionId: question._id,
        studentAnswer: exam.answers.find(a => a.questionId.toString() === question._id.toString())?.answer || '',
        correctAnswer: question.correctAnswer,
        questionType: question.type,
        points: question.points,
        feedback: ''
      }));
      setManualCorrections(initialCorrections);
    }
  };

  const updateManualCorrection = (index, field, value) => {
    const updatedCorrections = [...manualCorrections];
    updatedCorrections[index][field] = value;
    setManualCorrections(updatedCorrections);
  };

  const handleSubmitCorrection = async () => {
    if (!evaluatorName.trim()) {
      alert('Por favor, informe o nome do avaliador.');
      return;
    }

    setSubmitting(true);

    try {
      if (correctionMethod === 'automatic') {
        await axios.post(api.submitAutomaticCorrection(), {
          studentAnswerId: correctingExam._id,
          evaluatorName: evaluatorName.trim()
        });
      } else {
        await axios.post(api.submitManualCorrection(), {
          studentAnswerId: correctingExam._id,
          evaluatorName: evaluatorName.trim(),
          corrections: manualCorrections
        });
      }
      
      alert('Correção realizada com sucesso!');
      setCorrectingExam(null);
      setEvaluatorName('');
      fetchPendingExams();
    } catch (error) {
      console.error('Erro ao realizar correção:', error);
      alert('Erro ao realizar correção. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const annotated = useMemo(() => {
    return pendingExams
      .map(e => ({ ...e, meta: itemMeta.get('pending', e._id) }))
      .filter(e => (activeFolder === 'Sem pasta' ? (e.meta.folder || '') === '' : (e.meta.folder || '') === activeFolder))
      .sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''));
  }, [pendingExams, activeFolder]);

  const grouped = useMemo(() => {
    const map = {};
    annotated.forEach(e => {
      const folder = e.meta.folder || 'Sem pasta';
      if (!map[folder]) map[folder] = [];
      map[folder].push(e);
    });
    return map;
  }, [annotated]);

  const onDropToFolder = () => setPendingExams([...pendingExams]);
  const moveToFolder = (id, folder) => { itemMeta.set('pending', id, { folder }); setPendingExams([...pendingExams]); };

  const folders = useMemo(() => ['Sem pasta', ...getAvailableFolders('pending', pendingExams)], [pendingExams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando provas pendentes...</div>
      </div>
    );
  }

  if (correctingExam) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setCorrectingExam(null)}
            className="text-blue-500 hover:text-blue-700 text-sm sm:text-base"
          >
            ← Voltar para lista
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Corrigir Prova
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {correctingExam.examId.title}
            </h2>
            <p className="text-gray-600 mb-2">
              Aluno: {correctingExam.studentName}
            </p>
            <p className="text-gray-600 mb-4">
              Enviada em: {new Date(correctingExam.submittedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Correção
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="automatic"
                  checked={correctionMethod === 'automatic'}
                  onChange={(e) => setCorrectionMethod(e.target.value)}
                  className="mr-2"
                />
                Correção Automática com IA
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={correctionMethod === 'manual'}
                  onChange={(e) => setCorrectionMethod(e.target.value)}
                  className="mr-2"
                />
                Correção Manual
              </label>
            </div>
          </div>

          {correctionMethod === 'manual' && (
            <div className="space-y-6">
              {correctingExam.examId.questions.map((question, index) => {
                const studentAnswer = correctingExam.answers.find(a => 
                  a.questionId.toString() === question._id.toString()
                )?.answer || '';
                
                const correction = manualCorrections[index];

                return (
                  <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Questão {index + 1}
                    </h3>
                    <p className="text-gray-700 mb-4">{question.question}</p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resposta do Aluno:
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        {question.type === 'objective' ? (
                          <p>{studentAnswer}</p>
                        ) : (
                          <p className="whitespace-pre-wrap">{studentAnswer}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resposta Correta:
                      </label>
                      <div className="bg-green-50 p-3 rounded-md">
                        {question.type === 'objective' ? (
                          <p>{question.correctAnswer}</p>
                        ) : (
                          <p className="whitespace-pre-wrap">{question.correctAnswer}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pontos (máx: {question.points})
                        </label>
                        <input
                          type="number"
                          value={correction?.points || 0}
                          onChange={(e) => updateManualCorrection(index, 'points', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max={question.points}
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback
                        </label>
                        <textarea
                          value={correction?.feedback || ''}
                          onChange={(e) => updateManualCorrection(index, 'feedback', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Comentários sobre a resposta..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Avaliador *
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Digite seu nome"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitCorrection}
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Corrigindo...' : 'Finalizar Correção'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Corrigir Provas
      </h1>

      <FolderBar type="pending" items={pendingExams} activeFolder={activeFolder} onActiveFolderChange={setActiveFolder} onDropToFolder={onDropToFolder} />

      {annotated.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma prova pendente de correção.
        </div>
      ) : (
        <div className="space-y-6">
          {annotated.map((exam) => (
            <div
              key={exam._id}
              className={`bg-white p-6 rounded-lg shadow-md ${exam.meta.archived ? 'opacity-60' : ''}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', exam._id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {exam.examId.title}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Aluno: {exam.studentName}
                  </p>
                  <p className="text-gray-600 mb-2">
                    {exam.examId.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Enviada em: {new Date(exam.submittedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <ItemActions type="pending" id={exam._id} onChange={() => fetchPendingExams()} />
                    <div className="relative group">
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-800">⋯</button>
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-md p-2 hidden group-hover:block z-10 min-w-[180px]">
                        {folders.map(folder => (
                          <button key={folder} onClick={() => moveToFolder(exam._id, folder === 'Sem pasta' ? '' : folder)} className="block text-left w-full text-sm px-2 py-1 hover:bg-gray-50">Mover para: {folder}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startCorrection(exam)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Corrigir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorrectExam;
