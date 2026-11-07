// Emergency Engineer — Stage/Mission data architecture (Web/JS).
// See also: stage-schema.js, stage-session.js, stage-12-pump-selection.example.json

import { ObjectiveType } from './stage-schema.js';

function hasCalculationObjective(obj) {
  if (!obj) return false;
  if (obj.type === ObjectiveType.CALCULATION || obj.calculation) return true;
  if (obj.subObjectives && Array.isArray(obj.subObjectives)) {
    return obj.subObjectives.some(hasCalculationObjective);
  }
  return false;
}

function hasFormulaScoredObjective(obj) {
  if (!obj) return false;
  if (obj.selection?.scoreAsFormula === true) return true;
  if (obj.calculation?.scoreAsFormula === true) return true;
  if (obj.subObjectives && Array.isArray(obj.subObjectives)) {
    return obj.subObjectives.some(hasFormulaScoredObjective);
  }
  return false;
}

/**
 * Sanity-checks a parsed stage JSON object. Catches, for example, a
 * Selection objective where none of the authored options can actually
 * satisfy the stated requirement — the exact issue found in the first
 * pump-selection mockup (required Q and H, but no option met both) — and,
 * where present, a justification block with no factor marked correct.
 *
 * @param {import('./stage-schema.js').StageDefinition} stage
 * @param {boolean} [isRoot=true]
 * @returns {string[]} A list of human-readable problems. Empty = valid.
 */
export function validateStage(stage, isRoot = true) {
  const problems = [];

  if (isRoot) {
    if (!stage.stageId || typeof stage.stageId !== 'string') {
      problems.push('Missing or invalid stageId.');
    }

    if (stage.scoring) {
      const s = stage.scoring;
      const calcWeight = s.calculationAccuracyWeight ?? 0;
      const formulaWeight = s.correctFormulaWeight ?? 0;
      const speedWeight = s.solveSpeedWeight ?? 0;
      const errorWeight = s.errorCountWeight ?? 0;
      const decisionWeight = s.engineeringDecisionsWeight ?? 0;
      const sum = calcWeight + formulaWeight + speedWeight + errorWeight + decisionWeight;

      if (sum !== 100) {
        problems.push(`Scoring weights must sum to 100, got ${sum}.`);
      }

      if (calcWeight > 0 && !hasCalculationObjective(stage.objective)) {
        problems.push(`calculationAccuracyWeight is ${calcWeight}%, but stage has no calculation objective.`);
      }

      if (formulaWeight > 0 && !hasFormulaScoredObjective(stage.objective)) {
        problems.push(`correctFormulaWeight is ${formulaWeight}%, but stage has no objective with scoreAsFormula: true.`);
      }
    }
  }

  if (!stage.objective) {
    problems.push('No objective assigned.');
    return problems;
  }

  const { objective } = stage;

  switch (objective.type) {
    case ObjectiveType.SELECTION: {
      const sel = objective.selection;
      if (!sel || !sel.options || sel.options.length === 0) {
        problems.push('Selection objective has no options.');
        break;
      }
      if (sel.mode === 'multiple') {
        const ids = new Set(sel.options.map((o) => o.optionId));
        if (!sel.justification) {
          problems.push('Multi-selection objective has no follow-up justification, so the player cannot complete this step.');
        }
        if (!Array.isArray(sel.correctOptionIds) || sel.correctOptionIds.length === 0) {
          problems.push('Multi-selection objective has no correctOptionIds.');
        } else {
          sel.correctOptionIds.forEach((id) => {
            if (!ids.has(id)) problems.push(`correctOptionIds contains '${id}', which matches no option.`);
          });
        }
      } else {
        const anyMeets = sel.options.some((o) => o.meetsRequirements);
        const correctIdExists = sel.options.some((o) => o.optionId === sel.correctOptionId);
        if (!sel.correctOptionId) {
          problems.push('Single-selection objective is missing correctOptionId.');
        }
        if (!anyMeets) {
          problems.push(
            'No option has meetsRequirements = true — this stage currently has no valid answer.'
          );
        }
        if (sel.correctOptionId && !correctIdExists) {
          problems.push(`correctOptionId '${sel.correctOptionId}' matches no option.`);
        } else if (sel.correctOptionId && !sel.options.find((o) => o.optionId === sel.correctOptionId)?.meetsRequirements) {
          problems.push(`correctOptionId '${sel.correctOptionId}' does not point to an option marked meetsRequirements = true.`);
        }
      }

      if (sel.scoreAsFormula === true && sel.mode === 'multiple' &&
          (!Array.isArray(sel.correctOptionIds) || sel.correctOptionIds.length === 0)) {
        problems.push('Formula-scored multi-selection objective has no correctOptionIds.');
      }

      // Optional — only checked when a stage actually defines this feature,
      // so stages without `justification` are unaffected.
      if (sel.justification) {
        const factors = sel.justification.factors;
        if (!Array.isArray(factors) || factors.length === 0) {
          problems.push('Selection objective has a justification block with no factors.');
        } else if (!factors.some((f) => f.correct)) {
          problems.push(
            'Justification factors have no factor marked correct — the step could never be fully justified.'
          );
        }
      }
      break;
    }

    case ObjectiveType.CALCULATION:
      if (!objective.calculation) {
        problems.push('Calculation objective is missing its target.');
      }
      break;

    case ObjectiveType.DIAGNOSIS: {
      const diag = objective.diagnosis;
      const hasCorrect = diag?.hypotheses?.some((h) => h.isCorrect);
      if (!hasCorrect) {
        problems.push('Diagnosis objective has no hypothesis marked isCorrect.');
      }
      break;
    }

    case ObjectiveType.MULTI_STEP:
      if (!objective.subObjectives || objective.subObjectives.length === 0) {
        problems.push('MultiStep objective has no subObjectives.');
      } else {
        objective.subObjectives.forEach((sub, i) => {
          validateStage({ ...stage, objective: sub }, false).forEach((p) =>
            problems.push(`subObjectives[${i}]: ${p}`)
          );
        });
      }
      break;

    default:
      problems.push(`Unknown objective type '${objective.type}'.`);
  }

  if (stage.hints && stage.hints.length !== 3) {
    problems.push(`Expected 3 hints per the design doc, found ${stage.hints.length}.`);
  }

  for (const pipe of stage.network?.pipes ?? []) {
    if (pipe.roughnessMm === undefined) {
      problems.push(
        `Pipe '${pipe.pipeId}' has no roughnessMm — hf cannot be honestly calculated without it.`
      );
    }
  }

  return problems;
}

/**
 * Dev-time check across every stage file. Run with Node from the command line:
 *   node stage-validator.js stages/*.json
 * Safe to leave in the file — in a browser `process` is undefined, so this
 * block never runs there.
 */
if (typeof process !== 'undefined' && process.argv?.[1]?.replace(/\\/g, '/').endsWith('stage-validator.js')) {
  (async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    let rawArgs = process.argv.slice(2);
    let files = [];

    if (rawArgs.length === 0) {
      rawArgs = ['data/stages/stage-*.json'];
    }

    for (const arg of rawArgs) {
      if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
        const dirFiles = fs.readdirSync(arg)
          .filter((f) => f.startsWith('stage-') && f.endsWith('.json'))
          .map((f) => path.join(arg, f));
        files.push(...dirFiles);
      } else if (arg.includes('*') || arg.includes('?')) {
        const dir = path.dirname(arg) || '.';
        const filePattern = path.basename(arg);
        const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        if (fs.existsSync(dir)) {
          const matched = fs.readdirSync(dir)
            .filter((f) => regex.test(f))
            .map((f) => path.join(dir, f));
          files.push(...matched);
        }
      } else {
        files.push(arg);
      }
    }

    files = [...new Set(files)].sort();

    let hadProblems = false;
    const stageIdsSeen = new Map();

    for (const file of files) {
      try {
        const stage = JSON.parse(fs.readFileSync(file, 'utf8'));
        const problems = validateStage(stage);

        if (stage.stageId) {
          if (stageIdsSeen.has(stage.stageId)) {
            problems.push(`Duplicate stageId '${stage.stageId}' also found in '${stageIdsSeen.get(stage.stageId)}'.`);
          } else {
            stageIdsSeen.set(stage.stageId, file);
          }
        }

        if (problems.length) {
          hadProblems = true;
          console.warn(`\n${file}:`);
          problems.forEach((p) => console.warn(`  - ${p}`));
        }
      } catch (err) {
        hadProblems = true;
        console.warn(`\n${file}:`);
        console.warn(`  - Failed to read or parse JSON: ${err.message}`);
      }
    }

    if (!hadProblems) {
      console.log(`All ${files.length} stages valid.`);
    }
    process.exit(hadProblems ? 1 : 0);
  })();
}
