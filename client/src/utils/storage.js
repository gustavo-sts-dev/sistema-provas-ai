// Util simples para metadados de itens (arquivar, excluir, pasta) usando localStorage
// type: 'exam' | 'pending' | 'correction'

const STORAGE_KEY = 'app_item_meta_v1';
const FOLDERS_KEY = 'app_folders_v1';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getMeta(type, id) {
  const all = readAll();
  return all[`${type}:${id}`] || { archived: false, deleted: false, folder: '' };
}

function setMeta(type, id, partial) {
  const all = readAll();
  const key = `${type}:${id}`;
  const current = all[key] || { archived: false, deleted: false, folder: '' };
  all[key] = { ...current, ...partial };
  writeAll(all);
  return all[key];
}

function listByType(type, ids) {
  const all = readAll();
  const map = {};
  ids.forEach((id) => {
    map[id] = all[`${type}:${id}`] || { archived: false, deleted: false, folder: '' };
  });
  return map;
}

export const itemMeta = {
  get: getMeta,
  set: setMeta,
  listByType
};

export default itemMeta;

// Gestão de pastas por tipo (exam, pending, correction)
function readFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeFolders(data) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(data));
}

function getFolders(type) {
  const all = readFolders();
  return all[type] || [];
}

function addFolder(type, name) {
  if (!name) return getFolders(type);
  const all = readFolders();
  const list = new Set(all[type] || []);
  list.add(name);
  all[type] = Array.from(list).sort((a,b)=>a.localeCompare(b));
  writeFolders(all);
  return all[type];
}

function removeFolder(type, name) {
  const all = readFolders();
  all[type] = (all[type] || []).filter(f => f !== name);
  writeFolders(all);
  return all[type];
}

export const foldersStore = {
  get: getFolders,
  add: addFolder,
  remove: removeFolder
};

// Retorna todas as pastas disponíveis combinando as salvas e as inferidas dos itens
export function getAvailableFolders(type, items = []) {
  const saved = new Set(getFolders(type));
  items.forEach((it) => {
    const id = it?._id || it?.id;
    if (!id) return;
    const meta = getMeta(type, id);
    if (meta.folder) saved.add(meta.folder);
  });
  return Array.from(saved).sort((a,b)=>a.localeCompare(b));
}


