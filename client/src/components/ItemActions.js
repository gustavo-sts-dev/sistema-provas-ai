import React, { useState, useEffect } from 'react';
import { itemMeta } from '../utils/storage';

const ItemActions = ({ type, id, onChange }) => {
  const [meta, setMeta] = useState(itemMeta.get(type, id));
  const [folderInput, setFolderInput] = useState('');

  useEffect(() => {
    setMeta(itemMeta.get(type, id));
    setFolderInput('');
  }, [type, id]);

  const update = (partial) => {
    const next = itemMeta.set(type, id, partial);
    setMeta(next);
    if (onChange) onChange(next);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <button
        onClick={() => update({ archived: !meta.archived })}
        className={`px-3 py-1 rounded text-white text-xs ${meta.archived ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'}`}
      >
        {meta.archived ? 'Desarquivar' : 'Arquivar'}
      </button>

      <button
  onClick={async () => {
    try {
      const { api } = await import('../config/api');
      const axios = (await import('axios')).default;
      
      if (type === 'exam') {
        await axios.delete(api.deleteExam(id));
      } else if (type === 'pending') {
        await axios.delete(api.deletePendingExam(id));
      } else if (type === 'correction') {
        await axios.delete(api.deleteCorrection(id));
      }
      
      if (onChange) onChange();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir. Tente novamente.');
    }
  }}
  className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs"
>
  Excluir
</button>

      {/* Controles de pasta foram movidos para a FolderBar e menus dos cards */}
    </div>
  );
};

export default ItemActions;


