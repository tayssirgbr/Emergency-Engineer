import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { StageSession } from '../js/core/stage-session.js';
import { ObjectiveType } from '../js/core/stage-schema.js';
import { PASS_SCORE } from '../js/game-config.js';

describe('StageSession Core Mechanics', () => {
  const baseStage = {
    stageId: 'test_stage_1',
    titleArabic: 'مرحلة تجريبية',
    timeLimitSeconds: 60,
    scoring: {
      calculationAccuracyWeight: 0,
      solveSpeedWeight: 10,
      errorCountWeight: 20,
      engineeringDecisionsWeight: 70,
      correctFormulaWeight: 0,
      minorMistakePenalty: 5,
      wrongChoicePenalty: 10,
      criticalMistakePenalty: 20,
    },
    objective: {
      type: ObjectiveType.SELECTION,
      selection: {
        mode: 'single',
        correctOptionId: 'opt_a',
        options: [
          { optionId: 'opt_a', displayName: 'خيار صحيح', meetsRequirements: true, costEuro: 1000 },
          { optionId: 'opt_b', displayName: 'خيار خاطئ', meetsRequirements: false, costEuro: 500 },
        ],
      },
    },
    hints: [
      { textArabic: 'تلميح 1', scorePenalty: 5 },
      { textArabic: 'تلميح 2 (بلا عقوبة صريحة)' }, // tests P0-#15: undefined penalty
    ],
  };

  test('P0-#1: Failed attempt with 0 completed steps gives finalScore = 0 and rank = null', () => {
    const session = new StageSession({ ...baseStage });
    let endedDetail = null;
    session.addEventListener('stageEnded', (e) => {
      endedDetail = e.detail;
    });

    // Time expires without answering
    session.tick(65);

    assert.equal(session.isFinished, true);
    assert.ok(endedDetail, 'stageEnded event should fire');
    assert.equal(endedDetail.success, false);
    assert.equal(endedDetail.completedSteps, 0);
    assert.equal(endedDetail.finalScore, 0);
    assert.equal(endedDetail.rank, null, 'Rank must not be displayed on failure');
  });

  test('P0-#15: Non-numeric or missing hint scorePenalty does not cause NaN', () => {
    const session = new StageSession({ ...baseStage });
    session.useHint(1); // hint 2 has no scorePenalty
    assert.equal(session.hintsUsed, 1);
    session.selectOption('opt_a');
    assert.equal(session.isFinished, true);
    assert.ok(Number.isFinite(session.health));
  });

  test('P0-#15: Actions blocked while awaitingJustification', () => {
    const stageWithJust = {
      ...baseStage,
      objective: {
        type: ObjectiveType.SELECTION,
        selection: {
          mode: 'single',
          correctOptionId: 'opt_a',
          options: [
            { optionId: 'opt_a', displayName: 'خيار صحيح', meetsRequirements: true },
            { optionId: 'opt_b', displayName: 'خيار خاطئ', meetsRequirements: false },
          ],
          justification: {
            factors: [
              { factorId: 'f1', textArabic: 'عامل 1', correct: true },
              { factorId: 'f2', textArabic: 'عامل 2', correct: false },
            ],
            scoring: { fullBonus: 10, wrongFactorPenalty: 2 },
          },
        },
      },
    };

    const session = new StageSession(stageWithJust);
    session.selectOption('opt_a');
    assert.equal(session.isAwaitingJustification, true);

    // Attempting to select another option while awaiting justification must return false
    const blocked = session.selectOption('opt_b');
    assert.equal(blocked, false);

    // Attempting calculation while awaiting justification must return false
    const calcBlocked = session.submitCalculation(42);
    assert.equal(calcBlocked, false);
  });

  test('P1-#6: Multiple selection penalizes selecting wrong options in denominator', () => {
    const multiStage = {
      ...baseStage,
      scoring: { ...baseStage.scoring, correctFormulaWeight: 20 },
      objective: {
        type: ObjectiveType.SELECTION,
        selection: {
          mode: 'multiple',
          scoreAsFormula: true,
          correctOptionIds: ['opt_1', 'opt_2'],
          options: [
            { optionId: 'opt_1', displayName: '1' },
            { optionId: 'opt_2', displayName: '2' },
            { optionId: 'opt_3', displayName: '3' },
            { optionId: 'opt_4', displayName: '4' },
          ],
          justification: {
            factors: [{ factorId: 'f1', textArabic: 'f1', correct: true }],
          },
        },
      },
    };

    const session = new StageSession(multiStage);
    // Choosing all options (2 correct, 2 wrong)
    const outcome = session.submitMultipleSelection(['opt_1', 'opt_2', 'opt_3', 'opt_4']);
    assert.equal(outcome.isFullyCorrect, false);
    // Formula proportion = 2 / (2 + 2) = 0.50 -> 50%
    assert.equal(session._formulaAccuracy100, 50);
  });

  test('P1-#6: Justification denominator penalizes wrong factors', () => {
    const stageWithJust = {
      ...baseStage,
      objective: {
        type: ObjectiveType.SELECTION,
        selection: {
          mode: 'single',
          correctOptionId: 'opt_a',
          options: [{ optionId: 'opt_a', displayName: 'A', meetsRequirements: true }],
          justification: {
            factors: [
              { factorId: 'f1', textArabic: 'f1', correct: true },
              { factorId: 'f2', textArabic: 'f2', correct: false },
            ],
            scoring: { fullBonus: 10, wrongFactorPenalty: 2, maxWrongPenalty: 6 },
          },
        },
      },
    };

    const session = new StageSession(stageWithJust);
    session.selectOption('opt_a');
    // Player selects all factors: 1 correct + 1 wrong.
    // Denominator = 1 + 1 = 2 -> proportion = 1/2 = 0.5 -> bonus = 5, penalty = 2 -> netDelta = 3
    const outcome = session.submitJustification(['f1', 'f2']);
    assert.equal(outcome.bonus, 5);
    assert.equal(outcome.penalty, 2);
    assert.equal(outcome.netDelta, 3);
    assert.equal(outcome.isFullyCorrect, false);
  });

  test('P1-#7: Calculation accuracy uses average of last attempts per step', () => {
    const multiCalcStage = {
      ...baseStage,
      objective: {
        type: ObjectiveType.MULTI_STEP,
        subObjectives: [
          {
            type: ObjectiveType.CALCULATION,
            calculation: { expectedValue: 100, tolerancePercent: 5 },
          },
          {
            type: ObjectiveType.CALCULATION,
            calculation: { expectedValue: 50, tolerancePercent: 5 },
          },
        ],
      },
    };

    const session = new StageSession(multiCalcStage);
    // Step 0: First attempt with slight slip (e.g. 90 -> 10% error)
    session.submitCalculation(90);
    // Step 0: Second attempt correct (100 -> 0% error)
    session.submitCalculation(100);

    // Step 1: Attempt correct (50 -> 0% error)
    session.submitCalculation(50);

    // Average of step 0 (100%) and step 1 (100%) should be 100%
    assert.equal(session.calcAccuracy100, 100);
  });

  test('P1-#7: Decision score tracks first-try success', () => {
    const multiDecStage = {
      ...baseStage,
      objective: {
        type: ObjectiveType.MULTI_STEP,
        subObjectives: [
          {
            type: ObjectiveType.SELECTION,
            selection: {
              mode: 'single',
              correctOptionId: 'A',
              options: [
                { optionId: 'A', displayName: 'A', meetsRequirements: true },
                { optionId: 'B', displayName: 'B', meetsRequirements: false },
              ],
            },
          },
          {
            type: ObjectiveType.SELECTION,
            selection: {
              mode: 'single',
              correctOptionId: 'C',
              options: [
                { optionId: 'C', displayName: 'C', meetsRequirements: true },
                { optionId: 'D', displayName: 'D', meetsRequirements: false },
              ],
            },
          },
        ],
      },
    };

    const session = new StageSession(multiDecStage);
    // Step 0: wrong on attempt 1, then correct on attempt 2
    session.selectOption('B');
    session.selectOption('A');

    // Step 1: correct on attempt 1
    session.selectOption('C');

    // Solved on first try: 1 of 2 steps = 50%
    assert.equal(session.decisionScore100, 50);
  });

  test('P1-#10: selectOption deducts cost from budget when costEuro is defined', () => {
    const budgetStage = {
      ...baseStage,
      budgetEuro: 50000,
    };
    const session = new StageSession(budgetStage);
    assert.equal(session.budgetRemaining, 50000);
    session.selectOption('opt_a'); // costEuro = 1000
    assert.equal(session.budgetRemaining, 49000);
  });

  test('P1-#5: PASS_SCORE constant is set to 50', () => {
    assert.equal(PASS_SCORE, 50);
  });

  test('Calculation accepts approximate answers with 2 decimal places rounding', () => {
    const calcStage = {
      ...baseStage,
      objective: {
        type: ObjectiveType.CALCULATION,
        calculation: {
          expectedValue: 0.0176714586764,
          tolerancePercent: 2,
        },
      },
    };
    const session = new StageSession(calcStage);
    // Student submits 2 decimal places: 0.02
    const correct = session.submitCalculation(0.02);
    assert.equal(correct, true);
    assert.ok(session.calcAccuracy100 >= 95);
  });
});
