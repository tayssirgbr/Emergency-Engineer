import { getLanguage, t } from '../i18n.js';
import { localText } from '../learning-service.js';

const LEVEL_RANK = { unspecified: 0, year1: 1, year2: 2, year3: 3, master: 4 };

export function profileBelowStage(profile, metadata) {
  if (!profile || profile.educationLevel === 'unspecified' || !metadata?.academicLevel) return false;
  return (LEVEL_RANK[profile.educationLevel] ?? 0) < (LEVEL_RANK[metadata.academicLevel] ?? 0);
}

export function renderLearningDialog(container, { stageEntry, metadata, catalog, missingConcepts, profile, onStudy, onStart }) {
  const language = getLanguage();
  // P17: Remember the currently focused element so we can restore focus on close.
  const previouslyFocused = document.activeElement;
  const dialog = document.createElement('div');
  dialog.className = 'learning-backdrop';
  dialog.innerHTML = `<section class="learning-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="learning-title">
    <button class="icon-button learning-close" type="button" aria-label="${t('close')}" data-close>×</button>
    <p class="eyebrow">${t('prerequisites')}</p><h2 id="learning-title">${escapeHtml(getLanguage() === 'en' ? (metadata.titleEn ?? stageEntry.titleArabic ?? stageEntry.stageId) : (stageEntry.titleArabic ?? stageEntry.stageId))}</h2>
    <div class="learning-meta"><span>${t('learningLevel')}: ${metadata.academicLevel ? t(`level${metadata.academicLevel[0].toUpperCase()}${metadata.academicLevel.slice(1)}`) : '—'}</span><span>${t('difficulty')}: ${metadata.difficulty ? t(`difficulty${metadata.difficulty}`) : '—'}</span></div>
    <p>${profileBelowStage(profile, metadata) ? (language === 'ar' ? 'المستوى الذي اخترته أقل من المستوى المقترح لهذه المرحلة. يمكنك مراجعة المفاهيم أو المتابعة.' : 'Your selected study level is below this stage’s suggested level. Review the concepts or continue.') : t('studyFirst')}</p>
    <div class="learning-concepts">${(missingConcepts.length ? missingConcepts : (metadata.prerequisites ?? [])).map((id) => {
      const concept = catalog.concepts?.[id];
      if (!concept) return '';
      return `<article class="lesson-card"><h3>${escapeHtml(localText(concept.title))}</h3><p>${escapeHtml(localText(concept.definition))}</p><code>${escapeHtml(concept.formula ?? '')}</code><small>${escapeHtml(localText(concept.symbols))}</small></article>`;
    }).join('') || `<p class="empty-state">${t('noPrerequisiteBlock')}</p>`}</div>
    <p class="learning-note">${t('noPrerequisiteBlock')}</p>
    <label class="concept-verification" style="display:flex;align-items:center;gap:8px;margin:8px 0;font-size:0.88rem;cursor:pointer;">
      <input type="checkbox" data-concept-verified checked />
      <span>${language === 'ar' ? 'راجعت المفاهيم الهيدروليكية والعلاقات والوحدات المطلوبة.' : 'I reviewed the required hydraulic concepts, formulas, and units.'}</span>
    </label>
    <div class="learning-actions"><button class="button button--primary" data-study>${t('studyAndContinue')}</button><button class="button button--secondary" data-start>${t('startAnyway')}</button></div>
  </section>`;
  container.appendChild(dialog);

  // P17: Focus the close button when the dialog opens (accessibility).
  const closeBtn = dialog.querySelector('[data-close]');
  requestAnimationFrame(() => closeBtn?.focus());

  function closeDialog() {
    dialog.remove();
    // P17: Return focus to the element that was focused before the dialog opened.
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    document.removeEventListener('keydown', onKeyDown);
  }

  // P17: Escape closes the dialog, Tab stays trapped within modal.
  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (e.key === 'Tab') {
      const focusables = Array.from(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  document.addEventListener('keydown', onKeyDown);

  closeBtn.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  dialog.querySelector('[data-study]').addEventListener('click', () => { onStudy(missingConcepts.length ? missingConcepts : metadata.prerequisites ?? []); closeDialog(); });
  dialog.querySelector('[data-start]').addEventListener('click', () => { onStart(); closeDialog(); });
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
