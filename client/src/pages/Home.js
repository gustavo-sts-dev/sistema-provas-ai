import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';
import ItemActions from '../components/ItemActions';
import { itemMeta, getAvailableFolders } from '../utils/storage';
import FolderBar from '../components/FolderBar';

const Home = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('Sem pasta');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get(api.getExams());
      setExams(response.data.exams);
    } catch (error) {
      console.error('Erro ao carregar provas:', error);
    } finally {
      setLoading(false);
    }
  };

  const annotated = useMemo(() => {
    return exams
      .map(e => ({ ...e, meta: itemMeta.get('exam', e._id) }))
      .filter(e => (activeFolder === 'Sem pasta' ? (e.meta.folder || '') === '' : (e.meta.folder || '') === activeFolder))
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [exams, activeFolder]);

  const onDropToFolder = () => {
    setExams([...exams]);
  };

  const moveToFolder = (id, folder) => {
    itemMeta.set('exam', id, { folder });
    setExams([...exams]);
  };

  const folders = useMemo(() => ['Sem pasta', ...getAvailableFolders('exam', exams)], [exams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando provas...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Sistema de Provas
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Gerencie provas, realize avaliações e corrija automaticamente ou manualmente.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Link
            to="/create-exam"
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 sm:p-6 rounded-lg shadow-md transition-colors"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Criar Nova Prova</h3>
            <p className="text-sm sm:text-base text-blue-100">
              Crie provas manualmente ou gere automaticamente com IA
            </p>
          </Link>
          
          <Link
            to="/correct-exam"
            className="bg-green-500 hover:bg-green-600 text-white p-4 sm:p-6 rounded-lg shadow-md transition-colors"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Corrigir Provas</h3>
            <p className="text-sm sm:text-base text-green-100">
              Corrija provas automaticamente ou manualmente
            </p>
          </Link>
          
          <Link
            to="/results"
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 sm:p-6 rounded-lg shadow-md transition-colors sm:col-span-2 lg:col-span-1"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Ver Resultados</h3>
            <p className="text-sm sm:text-base text-purple-100">
              Visualize notas e feedbacks das provas corrigidas
            </p>
          </Link>
        </div>
      </div>

      <FolderBar
        type="exam"
        items={exams}
        activeFolder={activeFolder}
        onActiveFolderChange={setActiveFolder}
        onDropToFolder={onDropToFolder}
      />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Provas Disponíveis
        </h2>
        
        {annotated.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma prova disponível nesta pasta.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {annotated.map((exam) => (
              <div
                key={exam._id}
                className={`bg-white p-4 sm:p-6 rounded-lg shadow-md ${exam.meta.archived ? 'opacity-60' : ''}`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', exam._id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {exam.title}
                  </h3>
                  <div className="relative group">
                    <button className="px-2 py-1 text-gray-600 hover:text-gray-800">⋯</button>
                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-md p-2 hidden group-hover:block z-10 min-w-[180px]">
                      {folders.map(folder => (
                        <button key={folder} onClick={() => moveToFolder(exam._id, folder === 'Sem pasta' ? '' : folder)} className="block text-left w-full text-sm px-2 py-1 hover:bg-gray-50">Mover para: {folder}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{exam.description}</p>
                <div className="text-xs sm:text-sm text-gray-500 mb-2">
                  Criada em: {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mb-4">
                  Questões: {exam.questions.length}
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/take-exam/${exam._id}`}
                    className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm sm:text-base"
                  >
                    Realizar Prova
                  </Link>
                  <ItemActions type="exam" id={exam._id} onChange={() => fetchExams()} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
