import fs from 'node:fs';

const dir = 'data/stages';
let idx = 1;
const files = fs.readdirSync(dir).filter(x => x.endsWith('.json') && x !== 'index.json').sort((a,b) => {
  const numA = parseInt(a.match(/stage-(\d+)/)?.[1] || 0);
  const numB = parseInt(b.match(/stage-(\d+)/)?.[1] || 0);
  return numA - numB;
});

for (const f of files) {
  const s = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  function findCalcs(obj, title) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.calculation) {
      console.log(`${idx++}) [${f}] Step: "${title || obj.stepTitleArabic || 'Calc'}" | Param: ${obj.calculation.targetParameterKey} | Expected: ${obj.calculation.expectedValue} | Tol: ${obj.calculation.tolerancePercent}% | Prompt: "${obj.calculation.promptArabic}"`);
    }
    if (obj.subObjectives) {
      obj.subObjectives.forEach(sub => findCalcs(sub, sub.stepTitleArabic));
    }
  }
  findCalcs(s.objective, s.titleArabic);
}
