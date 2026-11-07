import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Stage Content Quality & Anti-Guessing Guardrails', () => {
  const stagesDir = path.resolve('data/stages');
  const stageFiles = fs.readdirSync(stagesDir)
    .filter((f) => f.startsWith('stage-') && f.endsWith('.json'))
    .map((f) => path.join(stagesDir, f));

  test('P1-#8b: Correct option is the longest in no more than 40% of single-choice questions', () => {
    let totalSingleChoice = 0;
    let correctIsLongest = 0;

    for (const file of stageFiles) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      function checkObjective(obj) {
        if (!obj) return;
        if (obj.selection && obj.selection.options && obj.selection.mode !== 'multiple') {
          totalSingleChoice++;
          const opts = obj.selection.options;
          const correctId = obj.selection.correctOptionId;
          const correctOpt = opts.find((o) => o.optionId === correctId);
          assert.ok(correctOpt, `Missing correctOption in ${file}`);

          const correctLen = (correctOpt.displayName || '').length;
          const maxLen = Math.max(...opts.map((o) => (o.displayName || '').length));
          if (correctLen === maxLen) {
            correctIsLongest++;
          }
        }
        if (obj.subObjectives) {
          obj.subObjectives.forEach(checkObjective);
        }
      }

      checkObjective(data.objective);
    }

    assert.ok(totalSingleChoice > 0, 'Must have single-choice questions');
    const ratio = correctIsLongest / totalSingleChoice;
    const percentage = (ratio * 100).toFixed(1);

    // Rule: correct is longest in <= 40% of questions
    assert.ok(
      ratio <= 0.40,
      `Correct option is longest in ${percentage}% (${correctIsLongest}/${totalSingleChoice}) which exceeds 40% threshold.`
    );
  });

  test('P1-#9: Every option in all stages has feedbackArabic authored', () => {
    const missing = [];

    for (const file of stageFiles) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const baseName = path.basename(file);

      function checkObjective(obj, pathStr) {
        if (!obj) return;
        if (obj.selection && Array.isArray(obj.selection.options)) {
          obj.selection.options.forEach((opt, idx) => {
            if (!opt.feedbackArabic || typeof opt.feedbackArabic !== 'string' || opt.feedbackArabic.trim() === '') {
              missing.push(`${baseName} ${pathStr} option[${idx}] (id: ${opt.optionId})`);
            }
          });
        }
        if (obj.subObjectives) {
          obj.subObjectives.forEach((sub, i) => checkObjective(sub, `${pathStr}.sub[${i}]`));
        }
      }

      checkObjective(data.objective, 'root');
    }

    assert.deepEqual(missing, [], `Found options missing feedbackArabic:\n${missing.join('\n')}`);
  });

  test('P1-#9: Every calculation objective has feedbackArabic authored', () => {
    const missing = [];

    for (const file of stageFiles) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const baseName = path.basename(file);

      function checkObjective(obj, pathStr) {
        if (!obj) return;
        if (obj.calculation) {
          const fb = obj.calculation.feedbackArabic;
          if (!fb || typeof fb !== 'string' || fb.trim() === '') {
            missing.push(`${baseName} ${pathStr} calculation (target: ${obj.calculation.targetParameterKey})`);
          }
        }
        if (obj.subObjectives) {
          obj.subObjectives.forEach((sub, i) => checkObjective(sub, `${pathStr}.sub[${i}]`));
        }
      }

      checkObjective(data.objective, 'root');
    }

    assert.deepEqual(missing, [], `Found calculations missing feedbackArabic:\n${missing.join('\n')}`);
  });
});
