import fs from 'node:fs';

const dir = 'data/stages';
const files = fs.readdirSync(dir).filter(x => x.endsWith('.json') && x !== 'index.json').sort((a,b) => {
  const numA = parseInt(a.match(/stage-(\d+)/)?.[1] || 0);
  const numB = parseInt(b.match(/stage-(\d+)/)?.[1] || 0);
  return numA - numB;
});

let totalSingle = 0;
let correctIsLongestCount = 0;
let totalOptions = 0;
let missingFeedbackOptions = 0;
let totalCalcs = 0;
let missingFeedbackCalcs = 0;

for (const f of files) {
  const s = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));

  function checkSelection(sel, title) {
    if (!sel || !sel.options) return;
    const isSingle = sel.mode !== 'multiple' && sel.correctOptionId;
    if (isSingle) {
      totalSingle++;
      const correctOpt = sel.options.find(o => o.optionId === sel.correctOptionId);
      const correctLen = ((correctOpt?.displayName || '') + (correctOpt?.labelArabic || '') + (correctOpt?.descriptionArabic || '')).length;
      let isLongest = true;
      for (const o of sel.options) {
        if (o === correctOpt) continue;
        const len = ((o.displayName || '') + (o.labelArabic || '') + (o.descriptionArabic || '')).length;
        if (len >= correctLen) {
          isLongest = false;
          break;
        }
      }
      if (isLongest) {
        correctIsLongestCount++;
      }
    }

    for (const opt of sel.options) {
      totalOptions++;
      if (!opt.feedbackArabic) {
        missingFeedbackOptions++;
      }
    }
  }

  function checkCalc(calc) {
    totalCalcs++;
    if (!calc.feedbackArabic) {
      missingFeedbackCalcs++;
    }
  }

  function walk(obj, title) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.selection) checkSelection(obj.selection, title || obj.stepTitleArabic);
    if (obj.calculation) checkCalc(obj.calculation);
    if (obj.subObjectives) {
      obj.subObjectives.forEach(sub => walk(sub, sub.stepTitleArabic));
    }
  }
  walk(s.objective, s.titleArabic);
}

const longestPercent = (correctIsLongestCount / totalSingle) * 100;
console.log(`Single selection questions: ${totalSingle}`);
console.log(`Correct is longest: ${correctIsLongestCount} (${longestPercent.toFixed(1)}%) [Target: <= 40%]`);
console.log(`Total options: ${totalOptions}, Missing feedback: ${missingFeedbackOptions}`);
console.log(`Total calculations: ${totalCalcs}, Missing feedback: ${missingFeedbackCalcs}`);
