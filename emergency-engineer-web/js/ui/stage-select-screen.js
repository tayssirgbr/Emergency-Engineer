// Emergency Engineer — stage selection screen.
import { getLanguage, t } from '../i18n.js';
import { mountPlayerDrawer } from './player-drawer.js';
import { isReviewMode, setReviewMode, unlockAllStages } from '../progress-store.js';

/**
 * @param {HTMLElement} container
 * @param {{stageId:string,url:string,level:number,stageIndexInLevel:number,titleArabic:string}[]} stages
 * @param {{
 *   isUnlocked: (stageId: string) => boolean,
 *   getBestScore: (stageId: string) => number|null,
 *   onSelectStage: (entry: object) => void,
 *   onBack: () => void,
 * }} options
 */
export function renderStageSelectScreen(container, stages, { isUnlocked, getBestScore, isCompleted = () => false, learning = {}, studentName = '', onSelectStage, onBack, onLanguageChange }) {
  const reviewActive = isReviewMode();
  container.innerHTML = `
    <div class="select-screen">
      <div class="select-header">
        <button class="hud-exit" data-action="back" title="${t('back')}" aria-label="${t('back')}">⤺</button>
        <div style="flex: 1;"><p class="eyebrow">MISSION SELECT / 01—${String(stages.length).padStart(2, '0')}</p><h2 class="select-title">${t('play')}</h2></div>
        <button
          type="button"
          class="review-mode-btn ${reviewActive ? 'review-mode-btn--active' : ''}"
          data-action="toggle-review"
          title="${getLanguage() === 'ar' ? 'تبديل وضع المراجعة لفتح كافة المراحل' : 'Toggle Review Mode'}"
        >
          ${reviewActive ? '🔓 ' + (getLanguage() === 'ar' ? 'المراجعة: كل المراحل مفتوحة' : 'Review: All Unlocked') : '🔒 ' + (getLanguage() === 'ar' ? 'فتح كل المراحل للمراجعة' : 'Unlock All for Review')}
        </button>
      </div>
      <div class="select-grid">
        ${stages
          .map((entry) => {
            const unlocked = isUnlocked(entry.stageId);
            const best = getBestScore(entry.stageId);
            const metadata = learning[entry.stageId] ?? {};
            const status = isCompleted(entry.stageId) ? t('done') : unlocked ? (best !== null ? `${t('bestScore')}: ${best} / 100` : t('unlocked')) : `🔒 ${t('locked')}`;
            return `
          <button
            class="stage-tile ${unlocked ? '' : 'stage-tile--locked'} ${isCompleted(entry.stageId) ? 'stage-tile--complete' : ''}"
            data-stage-id="${entry.stageId}"
            ${unlocked ? '' : 'disabled'}
          >
            <span class="stage-tile-top"><span class="stage-tile-level">${t('stage')} ${String(entry.stageIndexInLevel).padStart(2, '0')}</span><span class="stage-state">${isCompleted(entry.stageId) ? '✓' : unlocked ? '↗' : '⌑'}</span></span>
            <strong class="stage-tile-title">${getLanguage() === 'en' ? (metadata.titleEn ?? entry.titleArabic ?? entry.stageId) : (entry.titleArabic ?? entry.stageId)}</strong>
            <span class="stage-tile-meta">${t('difficulty')}: ${metadata.difficulty ? t(`difficulty${metadata.difficulty}`) : '—'} · ${t('learningLevel')}: ${metadata.academicLevel ? t(`level${metadata.academicLevel[0].toUpperCase()}${metadata.academicLevel.slice(1)}`) : '—'}</span>
            <span class="stage-tile-status">${status}</span>
          </button>`;
          })
          .join('')}
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
  container.querySelector('[data-action="toggle-review"]')?.addEventListener('click', () => {
    const nextState = !isReviewMode();
    setReviewMode(nextState);
    if (nextState) {
      unlockAllStages(stages.map((s) => s.stageId));
    }
    renderStageSelectScreen(container, stages, {
      isUnlocked,
      getBestScore,
      isCompleted,
      learning,
      studentName,
      onSelectStage,
      onBack,
      onLanguageChange,
    });
  });
  container.querySelectorAll('[data-stage-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const entry = stages.find((s) => s.stageId === btn.dataset.stageId);
      if (entry) onSelectStage(entry);
    });
  });
  mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
}
