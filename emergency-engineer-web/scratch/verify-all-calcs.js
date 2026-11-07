import fs from 'node:fs';

const stages = [
  'stage-4-hydraulic-head-loss.json',
  'stage-6-flow-velocity.json',
  'stage-7-diameter-performance.json',
  'stage-8-darcy-pressure-loss.json',
  'stage-9-multi-diameter-network.json',
  'stage-10-integrated-hydraulic-mission.json',
  'stage-11-field-distribution-diagnosis.json',
  'stage-12-partial-obstruction.json',
  'stage-13-unstable-pressure.json',
  'stage-14-field-action-selection.json',
  'stage-15-repair-plan.json',
  'stage-16-compound-emergency.json',
  'stage-17-multisegment-analysis.json',
  'stage-18-emergency-decision.json',
  'stage-19-failure-investigation.json',
  'stage-20-final-capstone.json',
];

const results = [];

for (const f of stages) {
  const s = JSON.parse(fs.readFileSync('data/stages/' + f, 'utf8'));
  const params = {};
  (s.givenParameters || []).forEach(p => params[p.key] = p.value);
  const pipes = {};
  (s.network?.pipes || []).forEach(p => pipes[p.pipeId] = p);

  function walk(obj, title) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.calculation) {
      results.push({
        file: f,
        stageIndex: s.stageIndexInLevel,
        stepTitle: title || obj.stepTitleArabic,
        calc: obj.calculation,
        params,
        pipes,
      });
    }
    if (obj.subObjectives) {
      obj.subObjectives.forEach(sub => walk(sub, sub.stepTitleArabic));
    }
  }
  walk(s.objective, s.titleArabic);
}

console.log('Collected', results.length, 'calculations');

// Let us write out verification for each of the 31 steps
results.forEach((r, i) => {
  const { file, stepTitle, calc, params } = r;
  const exp = calc.expectedValue;
  const key = calc.targetParameterKey;
  console.log(`\n--- Calc #${i+1} [Stage ${r.stageIndex} (${file})] Step: ${stepTitle} ---`);
  console.log(`Target: ${key}, Expected: ${exp}, Tol: ${calc.tolerancePercent}%`);
  console.log('Given params:', JSON.stringify(params));
});
