// Additive player data. Stage unlocks, completion, and best scores remain owned by progress-store.js.
const STORAGE_KEY = 'emergencyEngineer:player-data:v1';
const DEFAULTS = {
  profile: { educationLevel: 'unspecified' },
  settings: { language: 'ar', soundEnabled: true, musicEnabled: false },
  notes: [],
  events: [],
  studiedConcepts: [],
};

const memoryStore = new Map();
function getStorageItem(key) {
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  return memoryStore.get(key) ?? null;
}
function setStorageItem(key, val) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStore.set(key, val);
  }
}

function read() {
  try {
    const value = JSON.parse(getStorageItem(STORAGE_KEY) || 'null') ?? {};
    return {
      ...DEFAULTS,
      ...value,
      profile: { ...DEFAULTS.profile, ...(value.profile ?? {}) },
      settings: { ...DEFAULTS.settings, ...(value.settings ?? {}) },
      notes: Array.isArray(value.notes) ? value.notes : [],
      events: Array.isArray(value.events) ? value.events : [],
      studiedConcepts: Array.isArray(value.studiedConcepts) ? value.studiedConcepts : [],
    };
  } catch (error) {
    console.warn('[player-data-store] Could not read player data:', error);
    return {
      profile: { ...DEFAULTS.profile },
      settings: { ...DEFAULTS.settings },
      notes: [],
      events: [],
      studiedConcepts: [],
    };
  }
}

function write(data) {
  try {
    setStorageItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('[player-data-store] Could not save player data:', error);
    return false;
  }
}

export function getSettings() { return read().settings; }
export function updateSettings(patch) {
  const data = read();
  data.settings = { ...data.settings, ...patch };
  write(data);
  return data.settings;
}
export function getProfile() { return read().profile; }
export function updateProfile(patch) {
  const data = read();
  data.profile = { ...data.profile, ...patch };
  write(data);
  return data.profile;
}
export function getNotes() { return read().notes; }
export function saveNote(note) {
  const data = read();
  const now = new Date().toISOString();
  if (note.id) {
    data.notes = data.notes.map((item) => item.id === note.id ? { ...item, ...note, updatedAt: now } : item);
  } else {
    data.notes.unshift({ ...note, id: createId(), createdAt: now, updatedAt: now });
  }
  write(data);
  return data.notes;
}
export function deleteNote(id) {
  const data = read();
  data.notes = data.notes.filter((note) => note.id !== id);
  write(data);
  return data.notes;
}
export function getEvents() { return read().events; }
export function recordStageEvent(event) {
  const data = read();
  data.events.unshift({ ...event, id: createId(), createdAt: new Date().toISOString() });
  data.events = data.events.slice(0, 100);
  write(data);
  return data.events;
}
export function getStudiedConcepts() { return read().studiedConcepts; }
export function markConceptStudied(conceptId) {
  const data = read();
  if (!data.studiedConcepts.includes(conceptId)) data.studiedConcepts.push(conceptId);
  write(data);
  return data.studiedConcepts;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
