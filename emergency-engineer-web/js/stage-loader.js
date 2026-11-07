// Emergency Engineer — fetches and validates a stage JSON file.
import { validateStage } from './core/stage-validator.js';

/**
 * @param {string} url
 * @returns {Promise<import('./core/stage-schema.js').StageDefinition>}
 */
export async function loadStage(url) {
  let stage = null;
  if (typeof window !== 'undefined' && window.__EMERGENCY_DATA__?.stages) {
    const filename = url.split('/').pop().split('?')[0];
    stage = window.__EMERGENCY_DATA__.stages[filename]
      || window.__EMERGENCY_DATA__.stages[url]
      || Object.values(window.__EMERGENCY_DATA__.stages).find((s) => s.stageId === url || s.stageId === filename);
  }

  if (!stage) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`تعذّر تحميل المرحلة: ${url} (HTTP ${res.status})`);
    }
    stage = await res.json();
  }

  const problems = validateStage(stage);
  if (problems.length > 0) {
    console.warn(`[stage-loader] مشاكل في المرحلة "${stage.stageId ?? url}":`);
    problems.forEach((p) => console.warn('  - ' + p));
  }

  return stage;
}
