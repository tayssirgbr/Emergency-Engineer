import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateStage } from '../js/core/stage-validator.js';
import { ObjectiveType } from '../js/core/stage-schema.js';

describe('Stage Validator Rules', () => {
  const validStage = {
    stageId: 'valid_stage_id',
    titleArabic: 'مرحلة صحيحة',
    hints: [
      { textArabic: '1' },
      { textArabic: '2' },
      { textArabic: '3' },
    ],
    scoring: {
      calculationAccuracyWeight: 0,
      solveSpeedWeight: 10,
      errorCountWeight: 20,
      engineeringDecisionsWeight: 70,
      correctFormulaWeight: 0,
    },
    objective: {
      type: ObjectiveType.SELECTION,
      selection: {
        mode: 'single',
        correctOptionId: 'opt_1',
        options: [
          { optionId: 'opt_1', displayName: 'خيار 1', meetsRequirements: true },
          { optionId: 'opt_2', displayName: 'خيار 2', meetsRequirements: false },
        ],
      },
    },
  };

  test('P2-#13: Valid stage passes with 0 problems', () => {
    const problems = validateStage(validStage);
    assert.deepEqual(problems, []);
  });

  test('P2-#13: Flags scoring weights sum not equal to 100', () => {
    const invalidWeightsStage = {
      ...validStage,
      scoring: {
        ...validStage.scoring,
        engineeringDecisionsWeight: 80, // sum = 110
      },
    };
    const problems = validateStage(invalidWeightsStage);
    assert.ok(problems.some((p) => p.includes('Scoring weights must sum to 100')));
  });

  test('P1-#11: Flags calculationAccuracyWeight > 0 when no calculation objective exists', () => {
    const unmeasuredCalcStage = {
      ...validStage,
      scoring: {
        ...validStage.scoring,
        calculationAccuracyWeight: 20,
        engineeringDecisionsWeight: 50,
      },
    };
    const problems = validateStage(unmeasuredCalcStage);
    assert.ok(problems.some((p) => p.includes('calculationAccuracyWeight is 20%')));
  });

  test('P1-#11: Flags correctFormulaWeight > 0 when no formula-scored objective exists', () => {
    const unmeasuredFormulaStage = {
      ...validStage,
      scoring: {
        ...validStage.scoring,
        correctFormulaWeight: 10,
        engineeringDecisionsWeight: 60,
      },
    };
    const problems = validateStage(unmeasuredFormulaStage);
    assert.ok(problems.some((p) => p.includes('correctFormulaWeight is 10%')));
  });

  test('P2-#13: Flags missing stageId', () => {
    const noIdStage = { ...validStage, stageId: '' };
    const problems = validateStage(noIdStage);
    assert.ok(problems.some((p) => p.includes('stageId')));
  });
});
