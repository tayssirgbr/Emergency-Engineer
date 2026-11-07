// Emergency Engineer — Stage/Mission data architecture (Web/JS).
// See also: stage-schema.js, stage-validator.js, stage-12-pump-selection.example.json

import { ObjectiveType, MistakeSeverity, EngineeringRank } from './stage-schema.js';

/**
 * Live runtime state for one attempt at a stage. This is the bridge between
 * stage DATA (a parsed JSON StageDefinition) and whatever renders/simulates
 * it on the page — the network diagram, the sensor readouts, the decision
 * buttons.
 *
 * Extends EventTarget so the UI can just do:
 *   session.addEventListener('healthChanged', (e) => updateHealthBar(e.detail));
 *
 * This class does not know how to run the hydraulic network simulation
 * itself — see the buildNetwork() note near the bottom. It only tracks
 * health, score, time, budget, hints, and objective progress.
 */
export class StageSession extends EventTarget {
  /** @param {import('./stage-schema.js').StageDefinition} stage */
  constructor(stage) {
    super();
    this.stage = stage;
    this.health = 100;
    this.elapsedSeconds = 0;
    this.budgetRemaining = stage.budgetEuro ?? 0;
    this.hintsUsed = 0;
    this.isFinished = false;

    this._revealedKeys = new Set();
    this._hintPenalties = [];
    this._usedHintIndices = new Set();
    this._multiStepIndex = 0;
    this._stepDecisions = [];
    this._errorCount = 0;
    this._correctAnswerCount = 0;

    // Item 7: calculation accuracy = average accuracy of last attempt per calculation step.
    this._stepCalcAccuracies = {};
    // Item 7: decision score = percentage of decision steps solved on first attempt.
    this._decisionStepAttempts = {};
    this._decisionStepSolvedFirstTry = {};

    this._calcAccuracy100 = 100;
    // Keep the legacy neutral score for stages that do not explicitly mark a
    // formula-selection objective. Formula-scored objectives update this.
    this._formulaAccuracy100 = 100;
    this._decisionScore100 = 100;

    // Justification step (optional — only engaged when a Selection
    // objective's data defines `justification`; see submitJustification()).
    this._awaitingJustification = false;
    this._justificationBonus = 0;
    this._selectionBonus = 0;
  }

  get calcAccuracy100() {
    return this._calcAccuracyAverage();
  }

  get decisionScore100() {
    return this._decisionScoreFirstTry();
  }

  /** True while a correct Selection pick is waiting on submitJustification(). */
  get isAwaitingJustification() {
    return this._awaitingJustification;
  }

  get stepNumber() {
    return this.stage.objective?.type === ObjectiveType.MULTI_STEP ? this._multiStepIndex + 1 : 1;
  }

  get stepCount() {
    return this.stage.objective?.type === ObjectiveType.MULTI_STEP
      ? (this.stage.objective.subObjectives ?? []).length
      : 1;
  }

  get justificationBonus() {
    return this._justificationBonus;
  }

  get selectionBonus() {
    return this._selectionBonus;
  }

  get correctAnswerCount() {
    return this._correctAnswerCount;
  }

  get stepDecisions() {
    return this._stepDecisions.map((decision) => decision ? { ...decision, selectedIds: [...decision.selectedIds] } : null);
  }

  isHintUsed(hintIndex) {
    return this._usedHintIndices.has(hintIndex);
  }

  /** The objective currently active — itself for simple stages, or the
   * current sub-step for a MultiStep (Master Engineer) stage. */
  get currentObjective() {
    const root = this.stage.objective;
    if (!root || root.type !== ObjectiveType.MULTI_STEP) return root;
    const subs = root.subObjectives ?? [];
    if (subs.length === 0) return root;
    const i = Math.min(Math.max(this._multiStepIndex, 0), subs.length - 1);
    return subs[i];
  }

  /** Call once per animation frame / timer tick with the elapsed delta in seconds. */
  tick(deltaSeconds) {
    if (this.isFinished) return;
    this.elapsedSeconds += deltaSeconds;
    const limit = this.stage.timeLimitSeconds ?? 0;
    if (limit > 0 && this.elapsedSeconds >= limit) {
      this._end(false, 'Time expired');
    }
  }

  isParameterRevealed(key) {
    const param = this.stage.givenParameters.find((p) => p.key === key);
    return !!param && (!param.isHidden || this._revealedKeys.has(key));
  }

  /** Call when the player uses a measurement tool that reveals a hidden value. */
  revealParameter(key) {
    if (!this._revealedKeys.has(key)) {
      this._revealedKeys.add(key);
      this.dispatchEvent(new CustomEvent('parameterRevealed', { detail: key }));
    }
  }

  useHint(hintIndex) {
    const hints = this.stage.hints ?? [];
    if (this.isFinished || hintIndex < 0 || hintIndex >= hints.length || this._usedHintIndices.has(hintIndex)) return false;
    this._usedHintIndices.add(hintIndex);
    this.hintsUsed++;
    // Guard: scorePenalty must be a number; missing/non-numeric defaults to 0 (P0-#15).
    const penalty = Number(hints[hintIndex].scorePenalty);
    this._hintPenalties.push(Number.isFinite(penalty) ? penalty : 0);
    return true;
  }

  applyMistake(severity) {
    if (this.isFinished) return;
    const s = this.stage.scoring;
    const penalty =
      {
        [MistakeSeverity.MINOR]: s.minorMistakePenalty,
        [MistakeSeverity.WRONG_CHOICE]: s.wrongChoicePenalty,
        [MistakeSeverity.CRITICAL]: s.criticalMistakePenalty,
      }[severity] ?? 0;

    this._errorCount++;
    this.health = Math.min(100, Math.max(0, this.health - penalty));
    this.dispatchEvent(new CustomEvent('healthChanged', { detail: this.health }));
    if (this.health <= 0) this._end(false, 'System health depleted');
  }

  spendBudget(amountEuro) {
    this.budgetRemaining -= amountEuro;
  }

  /** Submit a numeric answer for the current Calculation (sub-)objective. */
  submitCalculation(value) {
    const target = this.currentObjective?.calculation;
    if (!target || this.isFinished || this._awaitingJustification) return false;

    const tolerance = target.tolerancePercent ?? 5;
    const percentError =
      target.expectedValue !== 0
        ? (Math.abs(value - target.expectedValue) / Math.abs(target.expectedValue)) * 100
        : Math.abs(value - target.expectedValue) * 100;

    let correct = percentError <= tolerance;

    // Accept approximate values rounded to 0..4 decimals or 1..4 sig figs,
    // or small absolute difference (<= 0.02) to avoid forcing students to enter 5 digits.
    if (!correct && Number.isFinite(target.expectedValue)) {
      const exp = target.expectedValue;
      for (let dec = 0; dec <= 4; dec++) {
        if (Math.abs(value - Number(exp.toFixed(dec))) < 1e-7) {
          correct = true;
          break;
        }
      }
      if (!correct) {
        for (let sig = 1; sig <= 4; sig++) {
          if (Math.abs(value - Number(exp.toPrecision(sig))) < 1e-7) {
            correct = true;
            break;
          }
        }
      }
      if (!correct && Math.abs(value - exp) <= 0.02) {
        correct = true;
      }
    }

    // Item 7: Record last attempt accuracy for this calculation step.
    // If accepted as correct via rounding, grant at least 95% accuracy.
    const accuracy = correct
      ? Math.min(100, Math.max(95, 100 - percentError))
      : Math.max(0, 100 - percentError);
    this._stepCalcAccuracies[this._multiStepIndex] = accuracy;
    this._calcAccuracy100 = this._calcAccuracyAverage();

    this._stepDecisions[this._multiStepIndex] = {
      selectedIds: [String(value)],
      answer: value,
      correct,
    };

    if (!correct) this.applyMistake(MistakeSeverity.MINOR);
    else {
      this._correctAnswerCount++;
      this._advanceOrEnd(true, 'Calculation correct');
    }
    return correct;
  }

  /**
   * Submit a choice for the current Selection (sub-)objective (e.g. pump A/B/C).
   */
  selectOption(optionId) {
    const target = this.currentObjective?.selection;
    if (!target || this.isFinished || this._awaitingJustification) return false;

    // Item 10: Deduct cost from budget if option has costEuro
    const chosenOption = target.options?.find((o) => o.optionId === optionId);
    if (chosenOption?.costEuro) {
      this.spendBudget(chosenOption.costEuro);
    }

    const currentStepIdx = this._multiStepIndex;
    this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;

    const correct = optionId === target.correctOptionId;
    if (correct && this._decisionStepAttempts[currentStepIdx] === 1) {
      this._decisionStepSolvedFirstTry[currentStepIdx] = true;
    }
    this._decisionScore100 = this._decisionScoreFirstTry();

    const formulaWeight = this.stage.scoring.correctFormulaWeight ?? 0;
    if (target.scoreAsFormula === true) {
      this._formulaAccuracy100 = correct ? 100 : 0;
    }
    this._stepDecisions[this._multiStepIndex] = { selectedIds: [optionId], correct };

    if (!correct) {
      this.applyMistake(MistakeSeverity.WRONG_CHOICE);
      return correct;
    }

    if (target.justification) {
      this._awaitingJustification = true;
      this.dispatchEvent(new CustomEvent('awaitingJustification', { detail: target.justification }));
    } else {
      this._correctAnswerCount++;
      this._advanceOrEnd(true, 'Correct selection');
    }
    return correct;
  }

  /** Submit a checkbox selection for a multi-answer Selection objective. */
  submitMultipleSelection(optionIds) {
    const target = this.currentObjective?.selection;
    if (!target || target.mode !== 'multiple' || this.isFinished || this._awaitingJustification) return null;
    if (!Array.isArray(optionIds) || optionIds.length === 0) return null;

    const validIds = new Set((target.options ?? []).map((option) => option.optionId));
    const chosenIds = [...new Set(optionIds)].filter((id) => validIds.has(id));
    if (chosenIds.length === 0) return null;

    const currentStepIdx = this._multiStepIndex;
    this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;

    const correctIds = target.correctOptionIds ?? [];
    const correctChosen = chosenIds.filter((id) => correctIds.includes(id));
    const wrongChosen = chosenIds.filter((id) => !correctIds.includes(id));
    const missedCorrect = correctIds.filter((id) => !chosenIds.includes(id));

    // Item 6: Denominator = (correctIds.length + wrongChosen.length)
    const formulaDenominator = correctIds.length + wrongChosen.length;
    const proportion = formulaDenominator > 0 ? correctChosen.length / formulaDenominator : 0;

    const isFullyCorrect = missedCorrect.length === 0 && wrongChosen.length === 0;
    if (isFullyCorrect && this._decisionStepAttempts[currentStepIdx] === 1) {
      this._decisionStepSolvedFirstTry[currentStepIdx] = true;
    }

    const formulaWeight = this.stage.scoring.correctFormulaWeight ?? 0;
    if (target.scoreAsFormula === true) {
      this._formulaAccuracy100 = Math.round(proportion * 100);
    }
    if (target.scoreAsFormula !== true || formulaWeight === 0) {
      this._decisionScore100 = this._decisionScoreFirstTry();
    }
    if (wrongChosen.length > 0 || missedCorrect.length > 0) this.applyMistake(MistakeSeverity.WRONG_CHOICE);

    this._awaitingJustification = true;
    const outcome = {
      correctChosen,
      wrongChosen,
      missedCorrect,
      isFullyCorrect,
      feedback: target.feedback ?? {},
    };
    const selectionBonus = outcome.isFullyCorrect ? (target.scoring?.fullBonus ?? 0) : 0;
    this._selectionBonus += selectionBonus;
    this._stepDecisions[this._multiStepIndex] = {
      selectedIds: chosenIds,
      correct: outcome.isFullyCorrect,
      bonus: selectionBonus,
    };
    outcome.selectionBonus = selectionBonus;
    this.dispatchEvent(new CustomEvent('awaitingJustification', { detail: target.justification }));
    return outcome;
  }

  /**
   * Submit the set of factor ids the player chose to justify their correct
   * pick.
   */
  submitJustification(chosenFactorIds) {
    const target = this.currentObjective?.selection;
    const justification = target?.justification;
    if (!justification || !this._awaitingJustification || this.isFinished) return null;
    if (!Array.isArray(chosenFactorIds) || chosenFactorIds.length === 0) return null;

    const factors = justification.factors ?? [];
    const correctIds = factors.filter((f) => f.correct).map((f) => f.factorId);
    const incorrectIds = factors.filter((f) => !f.correct).map((f) => f.factorId);

    const correctChosen = chosenFactorIds.filter((id) => correctIds.includes(id));
    const wrongChosen = chosenFactorIds.filter((id) => incorrectIds.includes(id));
    const missedCorrect = correctIds.filter((id) => !chosenFactorIds.includes(id));

    const scoring = justification.scoring ?? {};
    const fullBonus = scoring.fullBonus ?? 10;
    const perWrongPenalty = scoring.wrongFactorPenalty ?? 2;
    const maxWrongPenalty = scoring.maxWrongPenalty ?? 6;

    // Item 6: proportion = correctChosen / (correctIds.length + wrongChosen.length)
    const justDenominator = correctIds.length + wrongChosen.length;
    const proportion = justDenominator > 0 ? correctChosen.length / justDenominator : 0;
    const bonus = proportion * fullBonus;
    const penalty = Math.min(wrongChosen.length * perWrongPenalty, maxWrongPenalty);
    const netDelta = bonus - penalty;

    this._justificationBonus += netDelta;

    const outcome = {
      correctChosen,
      wrongChosen,
      missedCorrect,
      bonus,
      penalty,
      netDelta,
      isFullyCorrect: missedCorrect.length === 0 && wrongChosen.length === 0,
      feedback: justification.feedback ?? {},
      selectionBonus: this._stepDecisions[this._multiStepIndex]?.bonus ?? 0,
    };

    this._awaitingJustification = false;
    if (this._stepDecisions[this._multiStepIndex]?.correct) this._correctAnswerCount++;
    this._advanceOrEnd(true, 'Correct selection with justification', outcome);

    return outcome;
  }

  /** Submit a hypothesis id for the current Diagnosis (sub-)objective. */
  submitDiagnosis(hypothesisId) {
    const target = this.currentObjective?.diagnosis;
    if (!target || this.isFinished || this._awaitingJustification) return false;

    const currentStepIdx = this._multiStepIndex;
    this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;

    const match = target.hypotheses.find((h) => h.hypothesisId === hypothesisId);
    const correct = !!match?.isCorrect;
    if (correct && this._decisionStepAttempts[currentStepIdx] === 1) {
      this._decisionStepSolvedFirstTry[currentStepIdx] = true;
    }
    this._decisionScore100 = this._decisionScoreFirstTry();

    if (!correct) this.applyMistake(MistakeSeverity.WRONG_CHOICE);
    else {
      this._correctAnswerCount++;
      this._advanceOrEnd(true, 'Correct diagnosis');
    }
    return correct;
  }

  _getCalculationStepIndices() {
    const root = this.stage.objective;
    if (!root) return [];
    if (root.type === ObjectiveType.CALCULATION) return [0];
    if (root.type === ObjectiveType.MULTI_STEP) {
      const indices = [];
      (root.subObjectives ?? []).forEach((sub, i) => {
        if (sub.type === ObjectiveType.CALCULATION) indices.push(i);
      });
      return indices;
    }
    return [];
  }

  _calcAccuracyAverage() {
    const calcIndices = this._getCalculationStepIndices();
    if (calcIndices.length === 0) return 100;
    const sum = calcIndices.reduce((acc, idx) => acc + (this._stepCalcAccuracies[idx] ?? 0), 0);
    return Math.round(sum / calcIndices.length);
  }

  _getDecisionStepIndices() {
    const root = this.stage.objective;
    if (!root) return [];
    if (root.type === ObjectiveType.SELECTION || root.type === ObjectiveType.DIAGNOSIS) return [0];
    if (root.type === ObjectiveType.MULTI_STEP) {
      const indices = [];
      (root.subObjectives ?? []).forEach((sub, i) => {
        if (sub.type === ObjectiveType.SELECTION || sub.type === ObjectiveType.DIAGNOSIS) indices.push(i);
      });
      return indices;
    }
    return [];
  }

  _decisionScoreFirstTry() {
    const decIndices = this._getDecisionStepIndices();
    if (decIndices.length === 0) return 100;
    const solvedFirstTry = decIndices.filter((idx) => this._decisionStepSolvedFirstTry[idx] === true).length;
    return Math.round((solvedFirstTry / decIndices.length) * 100);
  }

  _advanceOrEnd(success, reason, justificationOutcome = null) {
    const root = this.stage.objective;
    if (root?.type === ObjectiveType.MULTI_STEP && this._multiStepIndex < root.subObjectives.length - 1) {
      const completedStepIndex = this._multiStepIndex;
      const completedObjective = root.subObjectives[completedStepIndex];
      this._multiStepIndex++;
      this.dispatchEvent(new CustomEvent('objectiveAdvanced', {
        detail: {
          completedStepIndex,
          nextStepIndex: this._multiStepIndex,
          totalSteps: root.subObjectives.length,
          completedObjective,
          justificationOutcome,
        },
      }));
      return;
    }
    this._end(success, reason);
  }

  _end(success, reason) {
    if (this.isFinished) return;
    this.isFinished = true;

    const hintPenalty = this._hintPenalties.reduce((a, b) => a + b, 0);
    const s = this.stage.scoring || {};

    // Item 7: ensure latest calc accuracy and first-try decision score are used
    const calcAccuracy = this._calcAccuracyAverage();
    const decisionScore = this._decisionScoreFirstTry();
    this._calcAccuracy100 = calcAccuracy;
    this._decisionScore100 = decisionScore;

    // Guard every weight against NaN — missing weights default to 0.
    const weighted =
      ((Number.isFinite(s.calculationAccuracyWeight) ? s.calculationAccuracyWeight : 0) * calcAccuracy) / 100 +
      ((Number.isFinite(s.solveSpeedWeight) ? s.solveSpeedWeight : 0) * this._speedScore100()) / 100 +
      ((Number.isFinite(s.errorCountWeight) ? s.errorCountWeight : 0) * Math.max(0, 100 - this._errorCount * 10)) / 100 +
      ((Number.isFinite(s.engineeringDecisionsWeight) ? s.engineeringDecisionsWeight : 0) * decisionScore) / 100 +
      ((Number.isFinite(s.correctFormulaWeight) ? s.correctFormulaWeight : 0) * this._formulaAccuracy100) / 100;

    // P0-#1: On failure, scale the raw score down by the fraction of steps
    // actually completed — a stage with no progress gets 0, not an inflated
    // score from unmeasured weight categories that were never touched.
    const totalSteps = this.stepCount;
    const completedSteps = success ? totalSteps : this._correctAnswerCount;
    const completionRatio = totalSteps > 0 ? Math.min(1, completedSteps / totalSteps) : (success ? 1 : 0);

    let rawScore = Math.max(0, weighted);
    let finalScore = rawScore;
    if (!success) {
      finalScore = rawScore * completionRatio;
    }
    finalScore = Math.round(finalScore) - hintPenalty + Math.round(this._justificationBonus + this._selectionBonus);
    finalScore = Math.min(100, Math.max(0, finalScore));
    // Final guard: if something upstream produced NaN, floor to 0.
    if (!Number.isFinite(finalScore)) finalScore = 0;

    this.dispatchEvent(
      new CustomEvent('stageEnded', {
        detail: {
          success,
          reason,
          finalScore,
          // P0-#1: Never expose rank on failure — display '—' in the UI.
          rank: success ? this._rankFor(finalScore) : null,
          justificationBonus: this._justificationBonus,
          selectionBonus: this._selectionBonus,
          correctCount: this._correctAnswerCount,
          completedSteps,
          totalSteps,
          elapsedSeconds: this.elapsedSeconds,
          debriefArabic: success ? this.stage.debriefSuccessArabic : this.stage.debriefFailureArabic,
        },
      })
    );
  }

  _speedScore100() {
    const limit = this.stage.timeLimitSeconds ?? 0;
    if (limit <= 0) return 100;
    return Math.min(1, Math.max(0, 1 - this.elapsedSeconds / limit)) * 100;
  }

  _rankFor(score) {
    if (score >= 90) return EngineeringRank.MASTER_ENGINEER;
    if (score >= 80) return EngineeringRank.SENIOR_ENGINEER;
    if (score >= 70) return EngineeringRank.HYDRAULIC_ENGINEER;
    if (score >= 60) return EngineeringRank.JUNIOR_ENGINEER;
    return EngineeringRank.EMERGENCY_TRAINING_REQUIRED;
  }

  // ---------------------------------------------------------------------
  // Extension point: wire this to your actual hydraulic simulation/renderer.
  // stage.network only holds plain data (ids, lengths, diameters) so it's
  // reusable regardless of how you render/simulate it — SVG, Canvas, etc.
  // ---------------------------------------------------------------------
  // buildNetwork() { ... }
}
