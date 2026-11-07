# Hydraulic Emergency Engineer — Game Design Contract

This document specifies the authoritative rules, invariants, and architectural contracts governing stage execution, scoring, progression, data integrity, and accessibility in the **Hydraulic Emergency Engineer** web application.

---

## 1. Immutable Invariants

1. **`stageId` Immutability**:
   `stageId` values (e.g. `L3_S12_PumpSelection`, `L3_S2_NetworkFaultDiagnosis`) are permanent identifiers. They must **never** be renamed or modified, because student progress, bookmarks, and saved analytics in localStorage directly key on them.
2. **Frameworkless Architecture**:
   The application runs purely on vanilla ES Modules (HTML5, CSS3, vanilla JavaScript, JSON). No bundlers, transpilers, or external runtime frameworks are permitted.
3. **Event-Driven Isolation**:
   `StageSession` extends `EventTarget` and remains strictly decoupled from UI rendering. It emits custom events (`healthChanged`, `parameterRevealed`, `awaitingJustification`, `objectiveAdvanced`, `stageEnded`), allowing tests and simulations to run headlessly in pure Node.js.

---

## 2. Scoring & Attempt Evaluation Contracts

### 2.1 Weight Distribution Rule
Every stage's `scoring` object must have category weights summing to exactly 100%:
$$\text{calculationAccuracyWeight} + \text{solveSpeedWeight} + \text{errorCountWeight} + \text{engineeringDecisionsWeight} + \text{correctFormulaWeight} = 100$$
- **Category Relevance Invariant**:
  - `calculationAccuracyWeight > 0` requires at least one `calculation` objective in the stage.
  - `correctFormulaWeight > 0` requires at least one objective marked `scoreAsFormula: true`.
  - Stages without formula-scored steps must allocate that weight to `engineeringDecisionsWeight`.
- **Speed Weight Ceiling**:
  - `solveSpeedWeight` is capped at a maximum of **10%** across all stages (Item 16). Pedagogical focus remains on engineering reasoning and safety, not rush.

### 2.2 Attempt Failure & Scaling Contract (P0-#1)
- When an attempt ends in failure (`success: false`, e.g. time expiration, health depletion, abandonment):
  $$\text{completionRatio} = \frac{\text{completedSteps}}{\text{totalSteps}}$$
  $$\text{finalScore} = \text{round}(\text{rawScore} \times \text{completionRatio}) - \text{hintPenalty} + \text{bonuses}$$
- If zero steps were completed ($\text{completedSteps} = 0$), the score is strictly **0**.
- **Rank Suppression**: No rank is awarded on a failed attempt (`rank: null`). The UI displays an en-dash (`—`) rather than any engineering rank.

### 2.3 Single-Mistake Mercy & Tracking (P1-#7)
- **Calculation Accuracy**: Calculated as the average of the *last attempt* across all calculation steps (`_calcAccuracyAverage()`). A slip on attempt 1 that is corrected on attempt 2 does not permanently destroy calculation accuracy.
- **Decision Score**: Measures the percentage of decision steps solved on the *first attempt* (`_decisionScoreFirstTry()`). Slips penalize first-try efficiency without creating permanent unrecoverable zeroes.

### 2.4 Selection & Justification Denominator Contract (P1-#6)
To prevent players from gaming multiple-choice questions by blindly checking all boxes:
- **Multiple Selection**:
  $$\text{proportion} = \frac{|\text{correctChosen}|}{|\text{correctOptionIds}| + |\text{wrongChosen}|}$$
- **Justification Factors**:
  $$\text{proportion} = \frac{|\text{correctChosen}|}{|\text{correctFactors}| + |\text{wrongChosen}|}$$
  Selecting all options or factors drastically dilutes the proportion and incurs penalties, ensuring guessing is heavily penalized.

---

## 3. Progression & Minimum Pass Threshold (P1-#5)

- **`PASS_SCORE = 50`** (defined in `js/game-config.js`):
  - A stage is marked as completed (`isStageCompleted = true`) **only** if `success === true` AND `finalScore >= PASS_SCORE`.
  - Unlocking the next stage in sequence requires `success === true` AND `finalScore >= PASS_SCORE`.
  - Completing all steps with a score $< 50$ yields a "Review Required" (`مراجعة مطلوبة`) outcome. The student is prompted to review learning content and retry.
- **Persistent Progress (`progress-store.js`)**:
  - `recordStageResult`: `bestScores` and `completedStageIds` are **only** updated on successful attempts (`success === true`). Failed attempts never overwrite an existing high score or mark a stage completed.

---

## 4. UI, Presentation, & Anti-Guessing Contracts

### 4.1 Option & Hypothesis Shuffling (P1-#8a)
- All options, justification factors, and diagnostic hypotheses are shuffled at render time via `shuffleArray()`.
- Named options (such as pump models A, B, C in Stage 1) may set `"shuffle": false` on the selection objective to preserve deliberate alphanumeric order.

### 4.2 Distractor Symmetry & Length (P1-#8b)
- Distractor options must be plausible engineering alternatives.
- The correct option must not be predictably identifiable by length alone (target: correct option is longest in $\le 40\%$ of stages).

### 4.3 Feedback Integrity (P1-#9)
- Every single incorrect option must have an authored `feedbackArabic` explaining specifically why it is unsuitable based on hydraulic principles.
- Every calculation step must provide contextual feedback or error guidance.

---

## 5. Storage & State Persistence (P2-#12)

- **Storage Key**: Current version is `emergencyEngineer:progress:v1`.
- **Legacy Migration**: If the versioned key is absent, the store automatically migrates legacy `emergencyEngineer:progress` without data loss.
- **Data Repair**: All reads pass through `repairShape()`, ensuring arrays (`unlockedStageIds`, `completedStageIds`) and dictionaries (`bestScores`) never crash on malformed or corrupted localStorage payloads.
- **Export/Import/Reset**:
  - Full progress can be exported to JSON and imported with structural validation.
  - Reset purges both versioned and legacy storage keys.

---

## 6. Accessibility & Offline Contract (WCAG AA & PWA)

1. **Color Contrast**:
   All interactive elements and panel text must satisfy WCAG AA contrast ($\ge 4.5:1$). Critical variables include `--brass-dim: #ba9050` and `--hazard: #ea7262`.
2. **Focus Management**:
   All modal dialogs (`learning-dialog`, `player-drawer`) must implement strict keyboard focus trapping (`Tab` cycle) and dismiss on `Escape`.
3. **Motion Sensitivity**:
   All animations must respect `@media (prefers-reduced-motion: reduce)`.
4. **Offline Autonomy**:
   The service worker (`v2`) caches all core assets, including self-hosted WOFF2 font files (`assets/fonts/`), ensuring 100% functionality without external CDNs or network connectivity.
