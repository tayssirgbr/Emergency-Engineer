// Emergency Engineer — stage (gameplay) screen controller.
import { StageSession } from '../core/stage-session.js';
import { ObjectiveType } from '../core/stage-schema.js';
import { NetworkRenderer } from '../network-renderer.js';
import { renderHud } from './hud.js';
import { t, getLanguage } from '../i18n.js';
import { showFeedbackToast } from './notifications.js';
import { getSettings } from '../player-data-store.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/stage-schema.js').StageDefinition} stage
 * @param {{ onExit?: () => void }} [options]
 * @returns {import('../core/stage-session.js').StageSession}
 */
export function renderStageScreen(container, stage, { onExit, onStageEnded, studentName = '', stages = [] } = {}) {
  // Item 16: Extra time option doubles the time limit
  const effectiveStage = getSettings().extraTime && stage.timeLimitSeconds > 0
    ? { ...stage, timeLimitSeconds: stage.timeLimitSeconds * 2 }
    : stage;
  const session = new StageSession(effectiveStage);

  // Error count isn't exposed by StageSession directly, but 'healthChanged'
  // fires exactly once per applyMistake() call, so counting it externally
  // gives an accurate count without touching stage-session.js.
  let errorCount = 0;
  session.addEventListener('healthChanged', () => {
    errorCount++;
  });

  container.innerHTML = `
    <div class="stage-screen">
      <div class="stage-hud" data-region="hud"></div>
      <div class="stage-tools panel" data-region="tools"></div>
      <div class="stage-network" data-region="network"></div>
      <div class="stage-briefing panel" data-region="briefing"></div>
      <div class="stage-panel panel" data-region="panel"></div>
    </div>
  `;

  const hudEl = container.querySelector('[data-region="hud"]');
  const briefingEl = container.querySelector('[data-region="briefing"]');
  const networkEl = container.querySelector('[data-region="network"]');
  const toolsEl = container.querySelector('[data-region="tools"]');
  const panelEl = container.querySelector('[data-region="panel"]');

  renderBriefing(briefingEl, stage, session);
  renderTools(toolsEl, stage);

  const renderer = new NetworkRenderer(networkEl, stage.network);
  renderer.addEventListener('elementSelected', (e) => highlightSelection(toolsEl, e.detail));

  const hud = renderHud(hudEl, session, { onExit, studentName, stages, activeMission: true });

  renderObjectivePanel(panelEl, session);
  session.addEventListener('objectiveAdvanced', (e) => renderStepAdvance(panelEl, session, e.detail));
  session.addEventListener('stageEnded', (e) => {
    if (!onStageEnded) {
      renderDebrief(panelEl, e.detail);
      return;
    }
    const budgetUsed = (stage.budgetEuro ?? 0) - session.budgetRemaining;
    const timeRemaining =
      stage.timeLimitSeconds > 0 ? Math.max(0, stage.timeLimitSeconds - session.elapsedSeconds) : null;
    onStageEnded({ ...e.detail, errorCount, budgetUsed, timeRemaining });
  });

  let lastTime = performance.now();
  function loop(now) {
    // P0-#2: If the stage panel has been replaced (e.g., player exited),
    // stop the RAF loop and the timer so no ghost stageEnded fires.
    if (!panelEl.isConnected) return;
    // P0-#3: Cap dt to 1 second per frame — prevents a tab-hidden jump
    // from consuming many minutes of game time in one tick.
    const rawDt = (now - lastTime) / 1000;
    const dt = Math.min(rawDt, 1);
    lastTime = now;
    session.tick(dt);
    hud.tick();
    if (!session.isFinished) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return session;
}

function renderBriefing(el, stage, session) {
  const rows = (stage.givenParameters ?? [])
    .map((p) => {
      const revealed = !p.isHidden || session.isParameterRevealed(p.key);
      const value = revealed ? `${p.value} ${p.unit}` : '؟';
      return `<li><span>${p.displayNameArabic}</span><span class="param-value${
        revealed ? '' : ' param-value--hidden'
      }">${value}</span></li>`;
    })
    .join('');

  el.innerHTML = `
    <p class="eyebrow">${stage.stageId} · ${t('stage')} ${stage.stageIndexInLevel ?? ''}</p>
    <h2 class="panel-title">${getLanguage() === 'en' ? (stage.learning?.titleEn ?? stage.titleArabic) : stage.titleArabic}</h2>
    <p>${stage.briefingArabic}</p>
    ${getLanguage() === 'en' ? `<p class="translation-notice">${t('arabicStageNotice')}</p>` : ''}
    ${stage.learning ? `<div class="stage-learning-strip"><span>${t('difficulty')}: ${stage.learning.difficulty}</span><span>${t('learningLevel')}: ${t(`level${capitalize(stage.learning.academicLevel)}`)}</span><span>${t('outcome')}: ${stage.learning.outcome?.[getLanguage()] ?? stage.learning.outcome?.ar ?? ''}</span></div>` : ''}
    <h3 class="panel-title">${getLanguage() === 'ar' ? 'المعطيات' : 'Parameters'}</h3>
    <ul class="param-list">${rows}</ul>
  `;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderTools(el, stage) {
  const items = (stage.availableTools ?? []).map((toolKey) => `<li><span>${t(toolKey) !== toolKey ? t(toolKey) : toolKey}</span></li>`).join('');
  el.innerHTML = `
    <h3 class="panel-title">${getLanguage() === 'ar' ? 'الأدوات المتاحة' : 'Available tools'}</h3>
    <ul class="tool-list">${items || `<li><span>${t('none')}</span></li>`}</ul>
    <div data-role="selection"></div>
  `;
}

function highlightSelection(toolsEl, selection) {
  const box = toolsEl.querySelector('[data-role="selection"]');
  if (!box) return;
  if (!selection) {
    box.innerHTML = '';
    return;
  }
  const label = selection.type === 'pipe' ? `${t('selectedPipe')}: ${selection.id}` : `${t('selectedNode')}: ${selection.id}`;
  box.innerHTML = `<p class="panel-title">${label}</p>`;
}

function renderObjectivePanel(panelEl, session) {
  const obj = session.currentObjective;
  if (!obj) {
    panelEl.innerHTML = `<p>${t('noObjective')}</p>`;
    return;
  }

  if (obj.type === ObjectiveType.SELECTION) {
    renderSelectionObjective(panelEl, session, obj.selection);
  } else if (obj.type === ObjectiveType.CALCULATION) {
    renderCalculationObjective(panelEl, session, obj.calculation);
  } else if (obj.type === ObjectiveType.DIAGNOSIS) {
    renderDiagnosisObjective(panelEl, session, obj.diagnosis);
  } else {
    panelEl.innerHTML = `<p>${t('unsupportedObjective')} (${obj.type})</p>`;
  }

  if (session.stepCount > 1) {
    const header = document.createElement('div');
    header.className = 'step-heading';
    header.innerHTML = `
      <span class="step-counter">${t('part')} ${session.stepNumber} / ${session.stepCount}</span>
      <h3>${obj.stepTitleArabic ?? t('diagnosticStep')}</h3>
      ${obj.instructionArabic ? `<p>${obj.instructionArabic}</p>` : ''}
    `;
    panelEl.prepend(header);
  }

  if (session.stepCount > 1 && session.stepNumber === session.stepCount) {
    const summary = document.createElement('section');
    summary.className = 'investigation-summary';
    summary.innerHTML = renderInvestigationSummary(session);
    const header = panelEl.querySelector('.step-heading');
    panelEl.insertBefore(summary, header?.nextSibling ?? panelEl.firstChild);
  }

  renderHints(panelEl, session);
}

function renderInvestigationSummary(session) {
  const objectives = session.stage.objective.subObjectives.slice(0, session.stepNumber - 1);
  return `
    <h3 class="panel-title">${t('investigationSummary')}</h3>
    <ol class="investigation-list">
      ${objectives.map((objective, index) => {
        const decision = session.stepDecisions[index];
        const selection = objective.selection;
        const options = selection?.options ?? [];
        const selectedLabels = decision?.answer !== undefined
          ? [`${objective.calculation?.targetParameterKey ?? (getLanguage() === 'ar' ? 'نتيجة الحساب' : 'Calculated result')} = ${decision.answer}`]
          : (decision?.selectedIds ?? []).map((id) => {
          const option = options.find((item) => item.optionId === id);
          return option?.displayName ?? option?.labelArabic ?? id;
        });
        const status = decision?.correct ? t('choicesMatchEvidence') : t('choicesNeedReview');
        return `<li>
          <strong>${objective.stepTitleArabic ?? `${t('part')} ${index + 1}`}</strong>
          <span>${selectedLabels.length ? selectedLabels.join('، ') : (getLanguage() === 'ar' ? 'لم تسجل اختيارات' : 'No selections recorded')}</span>
          <small>${status}</small>
        </li>`;
      }).join('')}
    </ol>
    <p class="summary-note">${t('summaryNote')}</p>
  `;
}

function renderSelectionObjective(panelEl, session, selection) {
  if (selection.mode === 'multiple') {
    renderMultipleSelectionObjective(panelEl, session, selection);
    return;
  }

  // Item 8a: Shuffle options unless shuffle === false (e.g. named pumps A/B/C)
  const displayOptions = selection.shuffle === false ? selection.options : shuffleArray(selection.options);

  panelEl.innerHTML = `
    <h3 class="panel-title">${selection.promptArabic ?? t('chooseOption')}</h3>
    <div class="option-grid">
      ${displayOptions
        .map(
          (o) => `
        <button class="option-card" data-option="${o.optionId}">
          <strong>${o.displayName ?? o.labelArabic ?? o.optionId}</strong>
          ${o.specs?.length ? `<ul>${o.specs
            .map((s) => `<li><span>${s.displayNameArabic}</span><span>${s.value} ${s.unit}</span></li>`)
            .join('')}</ul>` : ''}
          ${o.costEuro ? `<div class="option-cost">€ ${o.costEuro.toLocaleString(getLanguage() === 'ar' ? 'ar' : 'en')}</div>` : ''}
        </button>`
        )
        .join('')}
    </div>
    <div data-role="decision-feedback" aria-live="polite"></div>
    <div data-role="justification"></div>
    <div data-role="hints"></div>
  `;

  panelEl.querySelectorAll('[data-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const correct = session.selectOption(btn.dataset.option);
      // A correct pick ends the stage synchronously ONLY when the objective
      // has no justification step — StageSession dispatches 'stageEnded' in
      // that case, whose listener (see renderStageScreen) replaces panelEl's
      // innerHTML with the debrief before this line runs, so `btn` would be
      // a detached node. Stop instead of touching it.
      if (session.isFinished) return;

      if (!correct) {
        // A wrong pick does NOT end the stage (health just drops) — every
        // option must stay clickable so the player can keep trying.
        btn.classList.add('option-card--wrong');
        const feedback = panelEl.querySelector('[data-role="decision-feedback"]');
        feedback.innerHTML = `<p class="hint-text">${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? 'هذا الاختيار لا يفسر المعطيات الحالية. راجع المؤشرات وحاول مرة أخرى.'}</p>`;
        showFeedbackToast(panelEl, { correct: false, message: getLanguage() === 'ar' ? 'هذا الاختيار لا يفسر المعطيات الحالية.' : 'This choice does not explain the available evidence.', detail: `${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? ''} · ${penaltyDetail(session.stage, 'wrongChoice')}` });
        return;
      }

      // Correct pick: lock the choice in visually (no more switching pumps)
      // and, if this stage defines one, move into the justification step.
      btn.classList.add('option-card--correct');
      panelEl.querySelectorAll('[data-option]').forEach((b) => (b.disabled = true));
      const feedback = panelEl.querySelector('[data-role="decision-feedback"]');
      feedback.innerHTML = `<p class="decision-feedback decision-feedback--correct">${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? 'اختيار صحيح. انتقل إلى تبرير القرار.'}</p>`;
      if (session.isAwaitingJustification) {
        renderJustification(panelEl, session, selection.justification);
      }
      showFeedbackToast(panelEl, { correct: true, message: selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? t('earned') });
    });
  });
}

function renderMultipleSelectionObjective(panelEl, session, selection) {
  const displayOptions = selection.shuffle === false ? selection.options : shuffleArray(selection.options);
  panelEl.innerHTML = `
    <h3 class="panel-title">${selection.promptArabic ?? t('chooseMultiple')}</h3>
    ${selection.instructionArabic ? `<p>${selection.instructionArabic}</p>` : ''}
    <div class="multi-option-list">
      ${displayOptions.map((o) => `
        <label class="multi-option" data-option-row="${o.optionId}">
          <input type="checkbox" data-multi-option="${o.optionId}" />
          <span><strong>${o.displayName ?? o.labelArabic ?? o.optionId}</strong></span>
        </label>`).join('')}
    </div>
    <button class="calc-submit" data-action="submit-multiple">${t('submitOptions')}</button>
    <div data-role="decision-feedback" aria-live="polite"></div>
    <div data-role="justification"></div>
    <div data-role="hints"></div>
  `;

  const checks = Array.from(panelEl.querySelectorAll('[data-multi-option]'));
  const submit = panelEl.querySelector('[data-action="submit-multiple"]');
  submit.disabled = true;
  checks.forEach((check) => check.addEventListener('change', () => {
    submit.disabled = !checks.some((item) => item.checked);
  }));

  submit.addEventListener('click', () => {
    const chosen = checks.filter((item) => item.checked).map((item) => item.dataset.multiOption);
    const outcome = session.submitMultipleSelection(chosen);
    if (!outcome) return;
    checks.forEach((item) => { item.disabled = true; });
    submit.disabled = true;
    const byId = new Map(selection.options.map((option) => [option.optionId, option]));
    const feedbackLines = [
      ...outcome.correctChosen.map((id) => `✓ ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? 'اختيار مفيد للتحليل.'}`),
      ...outcome.missedCorrect.map((id) => `لم تختر ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? 'هذا عنصر مفيد في التحليل.'}`),
      ...outcome.wrongChosen.map((id) => `✕ ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? 'ليس عنصرًا مناسبًا لهذا التحليل.'}`),
    ];
    const feedback = panelEl.querySelector('[data-role="decision-feedback"]');
    if (outcome.selectionBonus > 0) feedbackLines.push(`${t('groupBonus')}: +${outcome.selectionBonus} ${t('points')}.`);
    feedback.innerHTML = feedbackLines.map((line) => `<p class="hint-text">${line}</p>`).join('');
    showFeedbackToast(panelEl, {
      correct: outcome.isFullyCorrect,
      message: outcome.isFullyCorrect ? t('earned') : feedbackLines.slice(0, 2).join(' '),
      detail: outcome.isFullyCorrect ? '' : penaltyDetail(session.stage, 'wrongChoice'),
      delta: outcome.selectionBonus > 0 ? outcome.selectionBonus : null,
    });
    if (session.isAwaitingJustification) renderJustification(panelEl, session, selection.justification);
  });
}

/**
 * The "justify your decision" step: a checkbox list built entirely from
 * stage data (selection.justification.factors) — never hard-coded in the
 * UI, and never free text, so the outcome stays fully deterministic.
 */
function renderJustification(panelEl, session, justification) {
  const host = panelEl.querySelector('[data-role="justification"]');
  if (!host || !justification) return;

  const displayFactors = justification.shuffle === false ? justification.factors : shuffleArray(justification.factors);

  host.innerHTML = `
    <h3 class="panel-title">${getLanguage() === 'ar' ? 'تبرير القرار' : 'Justify your decision'}</h3>
    <p>${justification.prompt ?? (getLanguage() === 'ar' ? 'لماذا اخترت هذا الخيار؟ اختر العوامل التي اعتمدت عليها.' : 'Why did you make this decision? Choose the supporting factors.')}</p>
    <div class="factor-grid">
      ${displayFactors
        .map(
          (f) => `
        <label class="factor-option">
          <input type="checkbox" data-factor="${f.factorId}" />
          <span>${f.labelArabic}</span>
        </label>`
        )
        .join('')}
    </div>
    <button class="calc-submit" data-action="confirm-justification" disabled>${getLanguage() === 'ar' ? 'تأكيد التبرير' : 'Confirm justification'}</button>
    <div data-role="justification-feedback"></div>
  `;

  const checkboxes = Array.from(host.querySelectorAll('[data-factor]'));
  const confirmBtn = host.querySelector('[data-action="confirm-justification"]');

  // Requirement: never allow confirming an empty justification.
  function updateConfirmState() {
    confirmBtn.disabled = !checkboxes.some((cb) => cb.checked);
  }
  checkboxes.forEach((cb) => cb.addEventListener('change', updateConfirmState));

  confirmBtn.addEventListener('click', () => {
    const chosen = checkboxes.filter((cb) => cb.checked).map((cb) => cb.dataset.factor);
    const outcome = session.submitJustification(chosen);
    if (!outcome) return; // guard: empty selection or already submitted
    checkboxes.forEach((cb) => (cb.disabled = true));
    confirmBtn.disabled = true;
    renderJustificationFeedback(host, outcome);
    showFeedbackToast(panelEl, { correct: outcome.isFullyCorrect, message: outcome.isFullyCorrect ? t('earned') : t('missed'), delta: Math.round(outcome.netDelta) });
  });
}

function renderJustificationFeedback(host, outcome) {
  const box = host.querySelector('[data-role="justification-feedback"]');
  if (!box) return;

  const lines = [];
  outcome.missedCorrect.forEach((id) => {
    const text = outcome.feedback.missedFactor?.[id];
    if (text) lines.push(text);
  });
  outcome.wrongChosen.forEach((id) => {
    const text = outcome.feedback.wrongFactor?.[id];
    if (text) lines.push(text);
  });
  if (lines.length === 0 && outcome.isFullyCorrect) {
    lines.push(t('justificationExcellent'));
  }

  const sign = outcome.netDelta >= 0 ? '+' : '';
  box.innerHTML =
    lines.map((l) => `<p class="hint-text">${l}</p>`).join('') +
    `<p class="justification-score readout">${t('justificationScoreImpact')}: ${sign}${Math.round(outcome.netDelta)}</p>`;
}

function renderStepAdvance(panelEl, session, detail) {
  const objective = detail.completedObjective;
  const outcome = detail.justificationOutcome;
  const feedbackLines = [];
  outcome?.missedCorrect?.forEach((id) => {
    const line = outcome.feedback?.missedFactor?.[id];
    if (line) feedbackLines.push(line);
  });
  outcome?.wrongChosen?.forEach((id) => {
    const line = outcome.feedback?.wrongFactor?.[id];
    if (line) feedbackLines.push(line);
  });
  if (feedbackLines.length === 0 && outcome?.isFullyCorrect) {
    feedbackLines.push(t('justificationCorrectStep'));
  }
  const delta = outcome?.netDelta ?? 0;
  const sign = delta >= 0 ? '+' : '';
  panelEl.innerHTML = `
    <div class="step-transition">
      <span class="step-counter">${t('completedStep')} ${detail.completedStepIndex + 1} / ${detail.totalSteps}</span>
      <h3>${objective.stepTitleArabic ?? t('diagnosticStep')}</h3>
      ${objective.feedbackArabic ? `<p>${objective.feedbackArabic}</p>` : ''}
      ${feedbackLines.map((line) => `<p class="hint-text">${line}</p>`).join('')}
      ${outcome?.selectionBonus > 0 ? `<p class="justification-score readout">${t('selectionBonusResult')}: +${outcome.selectionBonus} ${t('points')}</p>` : ''}
      <p class="justification-score readout">${t('justificationImpactResult')}: ${sign}${Math.round(delta)} ${t('points')}</p>
      <button class="calc-submit" data-action="continue-step">${t('continueStep')} ${detail.nextStepIndex + 1}</button>
    </div>
  `;
  panelEl.querySelector('[data-action="continue-step"]').addEventListener('click', () => renderObjectivePanel(panelEl, session));
}

function renderCalculationObjective(panelEl, session, calc) {
  panelEl.innerHTML = `
    <h3 class="panel-title">${t('enterCalculation')}${calc?.targetParameterKey ? ` (${calc.targetParameterKey})` : ''}</h3>
    <div class="calc-row">
      <input type="number" step="any" class="calc-input" placeholder="${t('valuePlaceholder')}" />
      <button class="calc-submit">${t('confirm')}</button>
    </div>
    <div data-role="calculation-feedback" aria-live="polite"></div>
    <div data-role="hints"></div>
  `;

  panelEl.querySelector('.calc-submit').addEventListener('click', () => {
    const input = panelEl.querySelector('.calc-input');
    const val = parseFloat(input.value);
    if (Number.isNaN(val)) return;
    const correct = session.submitCalculation(val);
    input.style.borderColor = correct ? 'var(--verdigris)' : 'var(--hazard)';
    // P14: guard — feedback el may be null if the panel was replaced.
    const feedback = panelEl.querySelector('[data-role="calculation-feedback"]');
    if (!correct && feedback?.isConnected) {
      // P9: Use stage-specific feedbackArabic; default avoids cross-stage assumptions.
      const msg = calc?.feedbackArabic ?? 'النتيجة خارج هامش القبول. راجع الوحدات والقيم المعوَّضة والعلاقة ثم حاول مرة أخرى.';
      feedback.innerHTML = `<p class="hint-text">${msg}</p>`;
      input.setAttribute('aria-invalid', 'true');
    }
    showFeedbackToast(panelEl, { correct, message: calc?.feedbackArabic ?? (correct ? t('earned') : t('missed')), detail: correct ? '' : penaltyDetail(session.stage, 'minor') });
  });
}

function renderDiagnosisObjective(panelEl, session, diagnosis) {
  const displayHypotheses = diagnosis.shuffle === false ? diagnosis.hypotheses : shuffleArray(diagnosis.hypotheses);
  panelEl.innerHTML = `
    <h3 class="panel-title">${t('diagnose')}</h3>
    <div class="option-grid">
      ${displayHypotheses
        .map((h) => `<button class="option-card" data-hypothesis="${h.hypothesisId}">${h.labelArabic}</button>`)
        .join('')}
    </div>
    <div data-role="hints"></div>
  `;

  panelEl.querySelectorAll('[data-hypothesis]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const correct = session.submitDiagnosis(btn.dataset.hypothesis);
      if (session.isFinished) return;
      // P19: Only colour wrong picks red — a correct pick that didn't end the
      // stage (e.g., part of a multi-step) should not be marked wrong.
      if (!correct) btn.classList.add('option-card--wrong');
      const selected = diagnosis.hypotheses.find((hypothesis) => hypothesis.hypothesisId === btn.dataset.hypothesis);
      showFeedbackToast(panelEl, { correct, message: correct ? selected?.labelArabic ?? t('earned') : t('missed'), detail: correct ? '' : penaltyDetail(session.stage, 'wrongChoice') });
    });
  });
}

function renderHints(panelEl, session) {
  const host = panelEl.querySelector('[data-role="hints"]');
  if (!host || !session.stage.hints?.length) return;

  host.innerHTML = session.stage.hints
    .map((h, i) => `<button class="hint-btn" data-hint="${i}">${t('hint')} ${i + 1} (-${h.scorePenalty})</button>`)
    .join('');

  host.querySelectorAll('[data-hint]').forEach((btn) => {
    btn.disabled = session.isHintUsed(Number(btn.dataset.hint));
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.hint);
      if (session.isHintUsed(i)) return;
      session.useHint(i);
      const p = document.createElement('p');
      p.className = 'hint-text';
      p.textContent = session.stage.hints[i].textArabic;
      host.insertAdjacentElement('afterend', p);
      btn.disabled = true;
    });
  });
}

function renderDebrief(panelEl, result) {
  panelEl.innerHTML = `
    <div class="debrief ${result.success ? 'debrief--success' : 'debrief--fail'}">
      <h3 class="debrief-title">${result.success ? 'نجحت المهمة' : 'فشلت المهمة'}</h3>
      <p>${result.debriefArabic ?? ''}</p>
      <p class="debrief-score">النتيجة: ${result.finalScore} / 100 — ${result.rank}</p>
    </div>
  `;
}

function capitalize(value = '') { return value ? value[0].toUpperCase() + value.slice(1) : ''; }
function penaltyDetail(stage, severity) {
  const key = severity === 'minor' ? 'minorMistakePenalty' : 'wrongChoicePenalty';
  const amount = stage.scoring?.[key] ?? 0;
  return getLanguage() === 'ar' ? `خصم صحة النظام: ${amount}%` : `System health penalty: ${amount}%`;
}
