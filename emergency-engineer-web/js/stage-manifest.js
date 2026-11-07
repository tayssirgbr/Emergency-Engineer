// Emergency Engineer — loads the ordered list of available stages.

const MANIFEST_URL = typeof import.meta !== 'undefined' && import.meta.url
  ? new URL('../data/stages/index.json', import.meta.url)
  : null;
// Stage entries in index.json store bare filenames (e.g. "foo.json") so
// authoring new stages doesn't require repeating the folder path. This is
// the single place that turns them into fetch-ready absolute URLs — every
// consumer (playStage, Retry, Next Stage) gets the normalized value because
// they all read entries via loadManifest()/nextStageId()/findStageEntry(),
// which all go through the same `cached` array below.
const STAGES_BASE_URL = typeof import.meta !== 'undefined' && import.meta.url
  ? new URL('../data/stages/', import.meta.url)
  : null;

let cached = null;

/** @returns {Promise<{stageId:string,url:string,level:number,stageIndexInLevel:number,titleArabic:string}[]>} */
export async function loadManifest() {
  if (cached) return cached;
  let data;
  if (typeof window !== 'undefined' && window.__EMERGENCY_DATA__?.manifest) {
    data = window.__EMERGENCY_DATA__.manifest;
  } else if (MANIFEST_URL) {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`تعذّر تحميل قائمة المراحل (HTTP ${res.status})`);
    data = await res.json();
  } else {
    throw new Error('تعذّر العثور على قائمة المراحل');
  }

  cached = (data.stages ?? []).map((entry) => ({
    ...entry,
    url: STAGES_BASE_URL ? new URL(entry.url, STAGES_BASE_URL).href : entry.url,
  }));
  return cached;
}

/** @returns {Promise<string|null>} the stageId right after `stageId` in play order, or null if last/not found */
export async function nextStageId(stageId) {
  const stages = await loadManifest();
  const i = stages.findIndex((s) => s.stageId === stageId);
  if (i === -1 || i === stages.length - 1) return null;
  return stages[i + 1].stageId;
}

/** @returns {Promise<object|null>} the manifest entry for `stageId`, or null if not found */
export async function findStageEntry(stageId) {
  const stages = await loadManifest();
  return stages.find((s) => s.stageId === stageId) ?? null;
}
