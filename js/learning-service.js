import { getLanguage } from './i18n.js';
import { getStudiedConcepts, markConceptStudied } from './player-data-store.js';

let catalogPromise = null;
const LEARNING_CATALOG_URL = typeof import.meta !== 'undefined' && import.meta.url
  ? new URL('../data/learning-content.json', import.meta.url)
  : null;
export function loadLearningCatalog() {
  if (typeof window !== 'undefined' && window.__EMERGENCY_DATA__?.learningContent) {
    return Promise.resolve(window.__EMERGENCY_DATA__.learningContent);
  }
  if (!catalogPromise) {
    if (!LEARNING_CATALOG_URL) {
      return Promise.reject(new Error('Learning catalog URL not configured'));
    }
    catalogPromise = fetch(LEARNING_CATALOG_URL).then((response) => {
      if (!response.ok) throw new Error(`Learning metadata unavailable (${response.status})`);
      return response.json();
    }).catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

export function localText(value) {
  if (value && typeof value === 'object') return value[getLanguage()] ?? value.ar ?? '';
  return value ?? '';
}

export async function getStageLearning(stageId) {
  const catalog = await loadLearningCatalog();
  return { ...(catalog.stages?.[stageId] ?? {}), catalog };
}

export function getMissingPrerequisites(metadata) {
  const studied = new Set(getStudiedConcepts());
  return (metadata.prerequisites ?? []).filter((id) => !studied.has(id));
}

export function studyConcepts(conceptIds) {
  conceptIds.forEach(markConceptStudied);
}

export function getConcept(catalog, id) { return catalog?.concepts?.[id] ?? null; }
