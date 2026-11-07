// Emergency Engineer — post-stage result screen.
import { t, getLanguage } from '../i18n.js';
import { mountPlayerDrawer } from './player-drawer.js';

const RANK_LABEL_KEYS = {
  masterEngineer: 'rankMasterEngineer',
  seniorEngineer: 'rankSeniorEngineer',
  hydraulicEngineer: 'rankHydraulicEngineer',
  juniorEngineer: 'rankJuniorEngineer',
  emergencyTrainingRequired: 'rankTrainingRequired',
};

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * @param {HTMLElement} container
 * @param {{
 *   stage: object,
 *   result: { success: boolean, passed?: boolean, finalScore: number, rank: string|null,
 *             debriefArabic?: string, errorCount: number, budgetUsed: number,
 *             timeRemaining: number|null, completedSteps?: number, totalSteps?: number },
 *   bestScore: number|null,
 *   hasNext: boolean,
 *   passScore?: number,
 *   onRetry: () => void,
 *   onNext: (() => void) | null,
 *   onStageSelect: () => void,
 * }} options
 */
export function renderResultScreen(container, { stage, result, bestScore, hasNext, passScore = 50, stages = [], studentName = '', onRetry, onNext, onStageSelect, onLanguageChange }) {
  // P1-#5: "review required" = completed all steps but below passing threshold.
  const reviewRequired = result.success && !result.passed;

  container.innerHTML = `
    <div class="result-screen">
      <div class="result-plate ${result.success ? 'result-plate--success' : 'result-plate--fail'}">
        <p class="eyebrow">MISSION REPORT</p>
        <h1 class="result-title">${
          reviewRequired
            ? (getLanguage() === 'ar' ? 'مراجعة مطلوبة' : 'Review required')
            : result.success
              ? (getLanguage() === 'ar' ? 'نجحت المهمة' : 'Mission completed')
              : (getLanguage() === 'ar' ? 'انتهت المحاولة' : 'Attempt ended')
        }</h1>
        <p class="result-stage-title">${getLanguage() === 'en' ? (stage.learning?.titleEn ?? stage.titleArabic) : stage.titleArabic}</p>
        ${reviewRequired ? `<p class="result-debrief result-debrief--review">${
          getLanguage() === 'ar'
            ? `أكملت جميع الخطوات، لكن درجتك (${result.finalScore}) أقل من الحد الأدنى للنجاح (${passScore}). راجع المفاهيم الأساسية وأعد المحاولة.`
            : `You completed all steps but scored ${result.finalScore} / 100, below the passing threshold of ${passScore}. Review the core concepts and try again.`
        }</p>` : (result.debriefArabic ? `<p class="result-debrief">${result.debriefArabic}</p>` : '')}

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-label">${t('score')}</span>
            <span class="result-stat-value readout">${result.finalScore} / 100</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t('rank')}</span>
            <span class="result-stat-value">${result.rank ? (RANK_LABEL_KEYS[result.rank] ? t(RANK_LABEL_KEYS[result.rank]) : result.rank) : '—'}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t('elapsed')}</span>
            <span class="result-stat-value readout">${formatTime(result.elapsedSeconds ?? (result.timeRemaining === null ? null : (stage.timeLimitSeconds ?? 0) - result.timeRemaining))}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${getLanguage() === 'ar' ? 'الميزانية المستعملة' : 'Budget used'}</span>
            <span class="result-stat-value readout">${
              result.budgetUsed > 0 ? `€ ${Math.round(result.budgetUsed).toLocaleString(getLanguage() === 'ar' ? 'ar' : 'en')}` : '—'
            }</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t('errors')}</span>
            <span class="result-stat-value readout">${result.errorCount}</span>
          </div>
          ${result.correctCount !== undefined ? `<div class="result-stat"><span class="result-stat-label">${t('correctAnswers')}</span><span class="result-stat-value readout">${result.correctCount}</span></div>` : ''}
          ${result.justificationBonus !== undefined ? `<div class="result-stat">
            <span class="result-stat-label">${getLanguage() === 'ar' ? 'أثر التبريرات' : 'Justification impact'}</span>
            <span class="result-stat-value readout">${result.justificationBonus > 0 ? '+' : ''}${Math.round(result.justificationBonus)} / 100</span>
          </div>` : ''}
          ${result.selectionBonus > 0 ? `<div class="result-stat">
            <span class="result-stat-label">${getLanguage() === 'ar' ? 'مكافآت الاختيار المتعدد' : 'Selection bonuses'}</span>
            <span class="result-stat-value readout">+${Math.round(result.selectionBonus)} / 100</span>
          </div>` : ''}
          <div class="result-stat">
            <span class="result-stat-label">${t('bestScore')}</span>
            <span class="result-stat-value readout">${bestScore ?? '—'}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="button button--secondary" data-action="retry">${getLanguage() === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
          ${hasNext && result.passed ? `<button class="button button--primary" data-action="next">${getLanguage() === 'ar' ? 'المرحلة التالية' : 'Next stage'}</button>` : ''}
          <button class="button button--ghost" data-action="stages">${t('stages')}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('[data-action="retry"]').addEventListener('click', onRetry);
  container.querySelector('[data-action="stages"]').addEventListener('click', onStageSelect);
  const nextBtn = container.querySelector('[data-action="next"]');
  if (nextBtn && onNext) nextBtn.addEventListener('click', onNext);
  mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
}
