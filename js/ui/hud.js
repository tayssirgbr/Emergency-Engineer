// Emergency Engineer — top instrument bar (timer, system health, budget).
import { t } from '../i18n.js';
import { mountPlayerDrawer } from './player-drawer.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/stage-session.js').StageSession} session
 * @param {{ onExit?: () => void }} [options]
 * @returns {{ tick: () => void }}
 */
export function renderHud(container, session, { onExit, studentName = '', stages = [], activeMission = false } = {}) {
  container.innerHTML = `
    <div class="hud">
      <button class="hud-exit" data-action="exit" title="${t('back')}" aria-label="${t('back')}">⤺</button>
      <div class="hud-item">
        <span class="hud-label">${t('timeRemaining')}</span>
        <span class="hud-value readout" data-field="timer">--:--</span>
      </div>
      <div class="hud-item hud-health">
        <span class="hud-label">${t('health')}</span>
        <div class="hud-bar"><div class="hud-bar-fill" data-field="healthBar"></div></div>
        <span class="hud-value readout" data-field="healthText">100%</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">${t('budget')}</span>
        <span class="hud-value readout" data-field="budget">—</span>
      </div>
    </div>
  `;

  if (onExit) {
    container.querySelector('[data-action="exit"]').addEventListener('click', onExit);
  }
  mountPlayerDrawer(container, { studentName, stages, currentStage: session.stage, activeMission });

  const timerEl = container.querySelector('[data-field="timer"]');
  const healthBarEl = container.querySelector('[data-field="healthBar"]');
  const healthTextEl = container.querySelector('[data-field="healthText"]');
  const budgetEl = container.querySelector('[data-field="budget"]');

  function updateTimer() {
    const limit = session.stage.timeLimitSeconds ?? 0;
    if (limit <= 0) {
      timerEl.textContent = '--:--';
      return;
    }
    const remaining = Math.max(0, limit - session.elapsedSeconds);
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = Math.floor(remaining % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }

  function updateHealth(health) {
    healthBarEl.style.width = `${health}%`;
    healthTextEl.textContent = `${Math.round(health)}%`;
    healthBarEl.classList.toggle('hud-bar-fill--low', health <= 30);
  }

  function updateBudget() {
    const hasBudget = (session.stage.budgetEuro ?? 0) > 0;
    budgetEl.textContent = hasBudget ? `${Math.round(session.budgetRemaining).toLocaleString('ar')} €` : '—';
  }

  session.addEventListener('healthChanged', (e) => updateHealth(e.detail));
  updateHealth(session.health);
  updateBudget();

  return {
    tick() {
      updateTimer();
      updateBudget();
    },
  };
}
