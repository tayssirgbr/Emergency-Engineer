// Emergency Engineer — localStorage-backed player progress.
// Pure storage layer: knows nothing about stage order (see stage-manifest.js
// for that) or how a stage attempt was scored — just get/set primitives.

// P2-#12: Versioned storage key with backwards-compatible migration.
const STORAGE_KEY = 'emergencyEngineer:progress:v1';
const LEGACY_STORAGE_KEY = 'emergencyEngineer:progress';

function defaultProgress() {
  return {
    studentName: '',
    unlockedStageIds: [],
    bestScores: {},
    completedStageIds: [],
  };
}

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
function removeStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

function readRaw() {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // P2-#12: Check legacy unversioned key and migrate seamlessly without data loss.
    const legacy = getStorageItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      writeRaw(parsed);
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[progress-store] تعذّرت قراءة التقدم المحفوظ:', err);
    return null;
  }
}

function writeRaw(data) {
  try {
    setStorageItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[progress-store] تعذّر حفظ التقدم:', err);
    // P2-#12: Notify the UI so a toast can inform the student.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-engineer:storage-error', { detail: String(err) }));
    }
  }
}

/** P2-#12: Repair any invalid shape from corrupted localStorage so
 * array methods (.push/.includes) never throw at runtime. */
export function repairShape(raw) {
  if (!raw || typeof raw !== 'object') return defaultProgress();
  const d = defaultProgress();
  d.studentName = typeof raw.studentName === 'string' ? raw.studentName : d.studentName;
  d.unlockedStageIds = Array.isArray(raw.unlockedStageIds) ? raw.unlockedStageIds.filter((id) => typeof id === 'string') : d.unlockedStageIds;
  d.bestScores = (raw.bestScores && typeof raw.bestScores === 'object' && !Array.isArray(raw.bestScores)) ? raw.bestScores : d.bestScores;
  d.completedStageIds = Array.isArray(raw.completedStageIds) ? raw.completedStageIds.filter((id) => typeof id === 'string') : d.completedStageIds;
  return d;
}

export function load() {
  return repairShape({ ...defaultProgress(), ...(readRaw() ?? {}) });
}

export function getStudentName() {
  return load().studentName || '';
}

export function setStudentName(name) {
  const data = load();
  data.studentName = name;
  writeRaw(data);
}

const REVIEW_KEY = 'emergencyEngineer:reviewMode';

export function isReviewMode() {
  if (typeof window !== 'undefined' && window.__REVIEW_MODE__ === true) return true;
  try {
    if (typeof window !== 'undefined' && window.location && (window.location.search.includes('review') || window.location.search.includes('dev') || window.location.search.includes('all'))) {
      return true;
    }
    if (getStorageItem(REVIEW_KEY) === 'true') return true;
  } catch { /* ignore */ }
  return false;
}

export function setReviewMode(enabled) {
  if (typeof window !== 'undefined') {
    window.__REVIEW_MODE__ = !!enabled;
  }
  try {
    setStorageItem(REVIEW_KEY, enabled ? 'true' : 'false');
  } catch { /* ignore */ }
}

export function isStageUnlocked(stageId) {
  if (isReviewMode()) return true;
  return load().unlockedStageIds.includes(stageId);
}

export function unlockAllStages(stageIds = []) {
  const data = load();
  if (Array.isArray(stageIds)) {
    stageIds.forEach((id) => {
      if (!data.unlockedStageIds.includes(id)) {
        data.unlockedStageIds.push(id);
      }
    });
    writeRaw(data);
  }
}

export function unlockStage(stageId) {
  const data = load();
  if (!data.unlockedStageIds.includes(stageId)) {
    data.unlockedStageIds.push(stageId);
    writeRaw(data);
  }
}

/** Call once at boot with the manifest's first stage so a brand-new player can start. */
export function ensureFirstStageUnlocked(firstStageId) {
  unlockStage(firstStageId);
}

export function getBestScore(stageId) {
  return load().bestScores[stageId] ?? null;
}

export function isStageCompleted(stageId) {
  return load().completedStageIds.includes(stageId);
}

/**
 * Records the outcome of a finished stage attempt.
 * P0-#1: bestScore and completedStageIds are ONLY updated on success — a
 * failed or abandoned attempt must not overwrite prior achievements.
 * @param {string} stageId
 * @param {{ success: boolean, score: number }} outcome
 * @returns {{ bestScore: number|null }}
 */
export function recordStageResult(stageId, { success, score }) {
  const data = load();
  // P0-#1: Only record bestScore on success.
  if (success) {
    const prevBest = data.bestScores[stageId] ?? null;
    if (prevBest === null || score > prevBest) {
      data.bestScores[stageId] = score;
    }
    if (!data.completedStageIds.includes(stageId)) {
      data.completedStageIds.push(stageId);
    }
    writeRaw(data);
  }
  return { bestScore: data.bestScores[stageId] ?? null };
}

/**
 * P2-#12: Export student progress and data as a JSON object string.
 * @returns {string}
 */
export function exportProgress() {
  const exportPayload = {
    format: 'emergency-engineer-progress',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: load(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * P2-#12: Import progress from JSON string with strict validation.
 * @param {string} jsonString
 * @returns {boolean} true if successful, false otherwise
 */
export function importProgress(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const progressData = parsed.progress ?? parsed;
    if (!progressData || typeof progressData !== 'object') return false;

    // Validate that required fields exist or are valid
    if (progressData.unlockedStageIds && !Array.isArray(progressData.unlockedStageIds)) return false;
    if (progressData.completedStageIds && !Array.isArray(progressData.completedStageIds)) return false;
    if (progressData.bestScores && (typeof progressData.bestScores !== 'object' || Array.isArray(progressData.bestScores))) return false;

    const sanitized = repairShape(progressData);
    writeRaw(sanitized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-engineer:progress-imported', { detail: sanitized }));
    }
    return true;
  } catch (err) {
    console.warn('[progress-store] تعذّر استيراد التقدم:', err);
    return false;
  }
}

/**
 * P2-#12: Reset progress back to initial empty state.
 */
export function resetProgress() {
  try {
    removeStorageItem(STORAGE_KEY);
    removeStorageItem(LEGACY_STORAGE_KEY);
    removeStorageItem(REVIEW_KEY);
    if (typeof window !== 'undefined') {
      window.__REVIEW_MODE__ = false;
      window.dispatchEvent(new CustomEvent('emergency-engineer:progress-reset'));
    }
    return true;
  } catch (err) {
    console.warn('[progress-store] تعذّر تصفير التقدم:', err);
    return false;
  }
}
