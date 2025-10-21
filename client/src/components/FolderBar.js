import React, { useEffect, useState } from 'react';
import { foldersStore, itemMeta, getAvailableFolders } from '../utils/storage';

const FolderBar = ({ type, items = [], onDropToFolder, activeFolder, onActiveFolderChange }) => {
  const [folders, setFolders] = useState(getAvailableFolders(type, items));
  const [name, setName] = useState('');

  useEffect(() => {
    setFolders(getAvailableFolders(type, items));
  }, [type, items]);

  const add = () => {
    const next = foldersStore.add(type, name.trim());
    setFolders(getAvailableFolders(type, items));
    setName('');
  };

  const onDrop = (e, folder) => {
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      itemMeta.set(type, id, { folder });
      if (onDropToFolder) onDropToFolder(id, folder);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova pasta"
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        />
        <button onClick={add} className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm">Criar pasta</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['Sem pasta', ...folders].map(folder => (
          <button
            key={folder}
            onClick={() => onActiveFolderChange && onActiveFolderChange(folder)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, folder === 'Sem pasta' ? '' : folder)}
            className={`px-3 py-1 rounded-full border text-sm ${activeFolder === folder ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'}`}
          >
            {folder}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FolderBar;


