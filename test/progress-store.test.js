import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  load,
  setStudentName,
  getStudentName,
  isStageUnlocked,
  unlockStage,
  ensureFirstStageUnlocked,
  getBestScore,
  isStageCompleted,
  recordStageResult,
  exportProgress,
  importProgress,
  resetProgress,
  repairShape,
  isReviewMode,
  setReviewMode,
  unlockAllStages,
} from '../js/progress-store.js';

describe('Progress Store Layer', () => {
  beforeEach(() => {
    resetProgress();
  });

  test('P0-#1: recordStageResult does NOT update bestScores or completedStageIds on failure', () => {
    // Record failure with high raw score (e.g. 85)
    const result = recordStageResult('stage_fail_test', { success: false, score: 85 });
    assert.equal(result.bestScore, null);
    assert.equal(getBestScore('stage_fail_test'), null);
    assert.equal(isStageCompleted('stage_fail_test'), false);
  });

  test('P0-#1: recordStageResult updates bestScores and completedStageIds on success', () => {
    const result = recordStageResult('stage_success_test', { success: true, score: 75 });
    assert.equal(result.bestScore, 75);
    assert.equal(getBestScore('stage_success_test'), 75);
    assert.equal(isStageCompleted('stage_success_test'), true);

    // Higher score updates bestScore
    recordStageResult('stage_success_test', { success: true, score: 90 });
    assert.equal(getBestScore('stage_success_test'), 90);

    // Lower score does not decrease bestScore
    recordStageResult('stage_success_test', { success: true, score: 80 });
    assert.equal(getBestScore('stage_success_test'), 90);
  });

  test('P2-#12: repairShape handles corrupted/invalid input gracefully', () => {
    // Non-object input
    const r1 = repairShape(null);
    assert.deepEqual(r1.unlockedStageIds, []);
    assert.deepEqual(r1.bestScores, {});

    // Malformed types (e.g. string where array expected)
    const r2 = repairShape({
      studentName: 123,
      unlockedStageIds: 'not_an_array',
      bestScores: 'not_an_object',
      completedStageIds: null,
    });
    assert.equal(r2.studentName, '');
    assert.deepEqual(r2.unlockedStageIds, []);
    assert.deepEqual(r2.bestScores, {});
    assert.deepEqual(r2.completedStageIds, []);

    // Array containing non-strings filtered
    const r3 = repairShape({
      unlockedStageIds: ['valid_stage', 456, null, {}],
    });
    assert.deepEqual(r3.unlockedStageIds, ['valid_stage']);
  });

  test('P2-#12: exportProgress and importProgress work end-to-end', () => {
    setStudentName('مهندس أحمد');
    unlockStage('stage_1');
    recordStageResult('stage_1', { success: true, score: 95 });

    const exported = exportProgress();
    assert.ok(typeof exported === 'string');

    // Reset and verify empty
    resetProgress();
    assert.equal(getStudentName(), '');
    assert.equal(isStageUnlocked('stage_1'), false);

    // Import and verify restored
    const ok = importProgress(exported);
    assert.equal(ok, true);
    assert.equal(getStudentName(), 'مهندس أحمد');
    assert.equal(isStageUnlocked('stage_1'), true);
    assert.equal(getBestScore('stage_1'), 95);
  });

  test('P2-#12: importProgress rejects malformed JSON or invalid schema', () => {
    assert.equal(importProgress('invalid-json-string'), false);
    assert.equal(importProgress(JSON.stringify({ unlockedStageIds: 'bad' })), false);
  });

  test('Review mode unlocks all stages without altering student progress', () => {
    assert.equal(isStageUnlocked('stage_99'), false);
    setReviewMode(true);
    assert.equal(isReviewMode(), true);
    assert.equal(isStageUnlocked('stage_99'), true);
    setReviewMode(false);
    assert.equal(isStageUnlocked('stage_99'), false);
  });
});
