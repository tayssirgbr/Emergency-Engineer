// Emergency Engineer — Stage/Mission data architecture (Web/JS).
// See also: stage-validator.js, stage-session.js, stage-12-pump-selection.example.json
//
// Stages are authored as plain JSON (see the .example.json file) and loaded
// at runtime with fetch(). This file documents the shape (JSDoc typedefs)
// and exports the string/number constants stage JSON should use, so editors
// can autocomplete and validation has one source of truth for valid values.

/** @enum {number} The six progression levels from the design document. */
export const LevelId = Object.freeze({
  HYDRAULIC_BASICS: 1,
  PIPE_FLOW: 2,
  NETWORKS: 3,
  OPEN_CHANNELS: 4,
  HYDRAULIC_EMERGENCIES: 5,
  MASTER_ENGINEER: 6,
});

/** @enum {string} The shape of a stage's objective. */
export const ObjectiveType = Object.freeze({
  CALCULATION: 'calculation',
  SELECTION: 'selection',
  DIAGNOSIS: 'diagnosis',
  MULTI_STEP: 'multiStep',
});

/** @enum {string} */
export const NodeKind = Object.freeze({
  RESERVOIR: 'reservoir',
  TANK: 'tank',
  JUNCTION: 'junction',
  PUMP_STATION: 'pumpStation',
  CONSUMER: 'consumer',
});

/** @enum {string} */
export const ToolType = Object.freeze({
  PRESSURE_GAUGE: 'pressureGauge',
  FLOW_METER: 'flowMeter',
  PIPE_DIAMETER_TOOL: 'pipeDiameterTool',
  ELEVATION_METER: 'elevationMeter',
  WATER_LEVEL_SENSOR: 'waterLevelSensor',
  VELOCITY_SENSOR: 'velocitySensor',
  TEMPERATURE_SENSOR: 'temperatureSensor',
  PUMP_MONITOR: 'pumpMonitor',
  VALVE_CONTROLLER: 'valveController',
  LEAK_DETECTOR: 'leakDetector',
});

/** @enum {string} */
export const FormulaType = Object.freeze({
  CONTINUITY: 'continuity',
  BERNOULLI: 'bernoulli',
  DARCY_WEISBACH: 'darcyWeisbach',
  REYNOLDS_NUMBER: 'reynoldsNumber',
  HYDRAULIC_POWER: 'hydraulicPower',
  MANNING_EQUATION: 'manningEquation',
  HYDROSTATIC_PRESSURE: 'hydrostaticPressure',
});

/** @enum {string} */
export const MistakeSeverity = Object.freeze({
  MINOR: 'minor',
  WRONG_CHOICE: 'wrongChoice',
  CRITICAL: 'critical',
});

/** @enum {string} */
export const EngineeringRank = Object.freeze({
  EMERGENCY_TRAINING_REQUIRED: 'emergencyTrainingRequired',
  JUNIOR_ENGINEER: 'juniorEngineer',
  HYDRAULIC_ENGINEER: 'hydraulicEngineer',
  SENIOR_ENGINEER: 'seniorEngineer',
  MASTER_ENGINEER: 'masterEngineer',
});

/**
 * @typedef {Object} StageParameter
 * @property {string} key                  e.g. "Q", "H", "rho", "g", "eta"
 * @property {string} displayNameArabic    e.g. "التدفق"
 * @property {string} [displayNameEnglish] e.g. "Flow rate"
 * @property {number} value
 * @property {string} unit                 e.g. "L/s", "m", "kg/m3", "bar"
 * @property {boolean} [isHidden]          true for Master Engineer values revealed via a tool
 * @property {string} [revealTool]         a ToolType value, required if isHidden
 */

/**
 * @typedef {Object} StagePipeSpec
 * @property {string} pipeId
 * @property {string} fromNodeId
 * @property {string} toNodeId
 * @property {number} lengthMeters
 * @property {number} diameterMm
 * @property {number} roughnessMm  Absolute roughness, needed for Darcy-Weisbach/
 *                                 Colebrook. Without it hf can only be guessed.
 */

/**
 * @typedef {Object} StageNodeSpec
 * @property {string} nodeId
 * @property {string} kind  a NodeKind value
 * @property {number} elevationMeters
 */

/**
 * @typedef {Object} SelectionOption
 * @property {string} optionId       "A", "B", "C"
 * @property {string} [displayName]  "المضخة A"
 * @property {StageParameter[]} [specs]
 * @property {string} [descriptionArabic] Explanation shown with the option
 * @property {string} [feedbackArabic] Feedback shown after it is evaluated
 * @property {number} [costEuro]
 * @property {boolean} meetsRequirements  Author-set: does this option actually
 *                                        satisfy the stated requirement? Checked
 *                                        by validateStage().
 */

/**
 * @typedef {Object} JustificationFactor
 * @property {string} factorId     stable id referenced by chosen-factor arrays and feedback maps
 * @property {string} labelArabic  the checkbox label shown to the player
 * @property {boolean} correct     deterministic ground truth — no AI, no free text
 */

/**
 * @typedef {Object} JustificationScoring
 * @property {number} [fullBonus]          default 10 — awarded when every correct factor is
 *                                         chosen and no incorrect factor is chosen
 * @property {number} [wrongFactorPenalty] default 2 — deducted per incorrect factor chosen
 * @property {number} [maxWrongPenalty]    default 6 — caps the total penalty so a bad
 *                                         justification never devastates the score
 */

/**
 * @typedef {Object} StageJustification
 * Optional. When present on a Selection objective, a correct pick does NOT
 * end the stage immediately — the player must also justify the decision by
 * choosing factors (checkboxes) before the stage can succeed. Omit this
 * field entirely for a stage where a correct pick should end things right
 * away, exactly as before — fully backward-compatible.
 * @property {string} [prompt]  the question shown above the factor checklist
 * @property {JustificationFactor[]} factors
 * @property {{ missedFactor?: Object<string,string>, wrongFactor?: Object<string,string> }} [feedback]
 *   Per-factorId explanation text: missedFactor for a correct factor the
 *   player didn't pick, wrongFactor for an incorrect factor they did pick.
 * @property {JustificationScoring} [scoring]
 */

/**
 * @typedef {Object} StageObjective
 * @property {string} type  an ObjectiveType value
 * @property {{targetParameterKey: string, expectedValue: number, tolerancePercent?: number, feedbackArabic?: string}} [calculation]
 * @property {{options: SelectionOption[], correctOptionId?: string, mode?: 'single'|'multiple', correctOptionIds?: string[], scoreAsFormula?: boolean, scoring?: {fullBonus?: number}, justification?: StageJustification, feedback?: Object<string,string>}} [selection]
 * @property {{hypotheses: {hypothesisId: string, labelArabic: string, isCorrect: boolean}[]}} [diagnosis]
 * @property {StageObjective[]} [subObjectives]  populated only when type === MULTI_STEP
 * @property {string} [stepTitleArabic]  optional heading shown for a MultiStep sub-objective
 * @property {string} [instructionArabic] optional field-instruction for this sub-objective
 * @property {string} [feedbackArabic]  short educational summary shown before advancing
 */

/**
 * @typedef {Object} StageDefinition
 * @property {string} stageId
 * @property {number} level  a LevelId value
 * @property {number} stageIndexInLevel  1-based, 1-5
 * @property {string} titleArabic
 * @property {string} briefingArabic
 * @property {{nodes: StageNodeSpec[], pipes: StagePipeSpec[]}} network
 * @property {StageParameter[]} givenParameters
 * @property {StageObjective} objective
 * @property {string[]} availableTools     ToolType values
 * @property {string[]} availableFormulas  FormulaType values
 * @property {{textArabic: string, scorePenalty: number}[]} hints  exactly 3 expected
 * @property {number} [timeLimitSeconds]   0/omitted = no timer
 * @property {number} [budgetEuro]         0/omitted = no budget mechanic
 * @property {Object} scoring
 * @property {number} scoring.calculationAccuracyWeight
 * @property {number} scoring.correctFormulaWeight
 * @property {number} scoring.solveSpeedWeight
 * @property {number} scoring.errorCountWeight
 * @property {number} scoring.engineeringDecisionsWeight
 * @property {number} scoring.minorMistakePenalty
 * @property {number} scoring.wrongChoicePenalty
 * @property {number} scoring.criticalMistakePenalty
 * @property {string} [debriefSuccessArabic]
 * @property {string} [debriefFailureArabic]
 */

/**
 * @typedef {Object} LevelDefinition
 * @property {number} id  a LevelId value
 * @property {string} titleArabic
 * @property {string} titleEnglish
 * @property {string} [summaryArabic]
 * @property {string[]} stageIds  ordered stageId references, 5 expected
 */
