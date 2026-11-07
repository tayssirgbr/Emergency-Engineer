// Emergency Engineer — shared game-balance constants.
// Import this file wherever you need PASS_SCORE or other global thresholds.
// Never hard-code these values in multiple places.

/**
 * P1-#5: Minimum score required to mark a stage as completed and unlock the
 * next one. Completing all steps with a score below this threshold shows a
 * "review required" result — no unlock, no completion mark.
 */
export const PASS_SCORE = 50;
