import * as progress from '../progress-store.js';
import * as playerData from '../player-data-store.js';
import { getLanguage, setLanguage, t } from '../i18n.js';
import { getAudioSettings, setAudioSettings } from '../audio-manager.js';
import { loadLearningCatalog, localText } from '../learning-service.js';

const PANELS = ['overview', 'stages', 'notebook', 'eventLog', 'tools', 'achievements', 'settings'];

export function mountPlayerDrawer(container, { studentName = '', stages = [], currentStage = null, activeMission = false, onLanguageChange } = {}) {
  const host = document.createElement('div');
  host.className = 'player-drawer-host';
  host.innerHTML = `
    <button class="drawer-trigger" type="button" aria-label="${t('menu')}" aria-expanded="false">☰ <span>${t('menu')}</span></button>
    <div class="drawer-backdrop" hidden>
      <aside class="player-drawer" role="dialog" aria-modal="true" aria-label="${t('menu')}">
        <div class="drawer-heading"><div><span class="eyebrow">HYDRAULIC / OPS</span><strong>${escapeHtml(studentName || t('profile'))}</strong></div><button class="icon-button" data-drawer-close aria-label="${t('close')}">×</button></div>
        ${currentStage ? `<div class="drawer-current"><small>${t('currentStage')}</small><strong>${escapeHtml(stageLabel(currentStage, stages))}</strong><div class="progress-track"><i style="width:${Math.round((currentStage.stageIndexInLevel / Math.max(stages.length, 1)) * 100)}%"></i></div><small>${t('progress')} · ${currentStage.stageIndexInLevel} / ${stages.length}</small></div>` : ''}
        <nav class="drawer-tabs" aria-label="${t('menu')}">${PANELS.map((key) => `<button type="button" data-panel="${key}">${t(key)}</button>`).join('')}</nav>
        <div class="drawer-content" data-drawer-content></div>
      </aside>
    </div>`;
  container.appendChild(host);

  const trigger = host.querySelector('.drawer-trigger');
  const backdrop = host.querySelector('.drawer-backdrop');
  const content = host.querySelector('[data-drawer-content]');
  let activePanel = 'overview';
  let editingNoteId = null;

  function open() { backdrop.hidden = false; trigger.setAttribute('aria-expanded', 'true'); renderPanel(); host.querySelector('[data-drawer-close]').focus(); }
  function close() { backdrop.hidden = true; trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
  function renderPanel() {
    host.querySelectorAll('[data-panel]').forEach((button) => button.classList.toggle('is-active', button.dataset.panel === activePanel));
    if (activePanel === 'overview') renderOverview();
    if (activePanel === 'stages') renderStages();
    if (activePanel === 'notebook') renderNotebook();
    if (activePanel === 'eventLog') renderEvents();
    if (activePanel === 'tools') renderTools();
    if (activePanel === 'achievements') renderAchievements();
    if (activePanel === 'settings') renderSettings();
  }
  function renderOverview() {
    const completed = stages.filter((stage) => progress.isStageCompleted(stage.stageId)).length;
    const events = playerData.getEvents();
    const attempts = events.filter((event) => event.type === 'stageAttempt');
    const totalErrors = attempts.reduce((sum, event) => sum + (event.errorCount ?? 0), 0);
    const correct = attempts.reduce((sum, event) => sum + (event.correctCount ?? 0), 0);
    const seconds = attempts.reduce((sum, event) => sum + (event.elapsedSeconds ?? 0), 0);
    const avg = attempts.length ? Math.round(attempts.reduce((sum, event) => sum + (event.score ?? 0), 0) / attempts.length) : null;
    const rank = completed >= 20 ? (getLanguage() === 'ar' ? 'مهندس الطوارئ' : 'Emergency Engineer')
      : completed >= 10 ? (getLanguage() === 'ar' ? 'محقق ميداني' : 'Field Investigator')
        : completed >= 5 ? (getLanguage() === 'ar' ? 'محلل هيدروليكي' : 'Hydraulic Analyst')
          : completed ? (getLanguage() === 'ar' ? 'مهندس متدرب' : 'Trainee Engineer') : (getLanguage() === 'ar' ? 'مهندس جديد' : 'New Engineer');
    content.innerHTML = `<section class="drawer-panel"><p class="eyebrow">${t('profile')}</p><label>${t('educationLevel')}<select data-profile-level>${educationOptions()}</select></label><div class="hub-stats"><article><strong>${completed}</strong><span>${t('completed')}</span></article><article><strong>${avg ?? '—'}</strong><span>${t('averageScore')}</span></article><article><strong>${correct}</strong><span>${t('correctAnswers')}</span></article><article><strong>${totalErrors}</strong><span>${t('errors')}</span></article><article><strong>${formatDuration(seconds)}</strong><span>${t('timePlayed')}</span></article><article><strong>${rank}</strong><span>${t('rank')}</span></article></div><p class="hub-footnote">${getLanguage() === 'ar' ? 'الإحصاءات التفصيلية تُسجل من المحاولات بعد هذا التحديث.' : 'Detailed attempt statistics are recorded from this update onward.'}</p></section>`;
    const level = content.querySelector('[data-profile-level]');
    level.value = playerData.getProfile().educationLevel ?? 'unspecified';
    level.addEventListener('change', () => playerData.updateProfile({ educationLevel: level.value }));
  }
  function renderStages() {
    content.innerHTML = `<section class="drawer-panel"><div class="drawer-stage-list">${stages.map((stage) => {
      const unlocked = progress.isStageUnlocked(stage.stageId);
      const complete = progress.isStageCompleted(stage.stageId);
      const mark = complete ? '✓' : unlocked ? '●' : '🔒';
      return `<article class="drawer-stage-row"><span>${mark}</span><div><strong>${t('stage')} ${stage.stageIndexInLevel} · ${escapeHtml(stage.titleArabic ?? stage.stageId)}</strong><small>${complete ? t('done') : unlocked ? t('unlocked') : t('locked')} · ${t('bestScore')}: ${progress.getBestScore(stage.stageId) ?? '—'}</small></div></article>`;
    }).join('')}</div></section>`;
  }
  function renderNotebook() {
    const notes = playerData.getNotes();
    const note = notes.find((item) => item.id === editingNoteId);
    content.innerHTML = `<section class="drawer-panel"><form class="note-form"><label>${t('noteTitle')}<input name="title" maxlength="90" value="${escapeAttr(note?.title ?? '')}" required /></label><label>${t('noteBody')}<textarea name="body" rows="4" maxlength="2000" required>${escapeHtml(note?.body ?? '')}</textarea></label><button class="button button--primary" type="submit">${note ? t('save') : t('addNote')}</button>${note ? `<button class="text-button" type="button" data-cancel-edit>${t('cancel')}</button>` : ''}</form><div class="note-list">${notes.length ? notes.map((item) => `<article class="note-card"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><div><button type="button" data-edit-note="${item.id}">${t('edit')}</button><button type="button" data-delete-note="${item.id}">${t('delete')}</button></div></article>`).join('') : `<p class="empty-state">${t('noNotes')}</p>`}</div></section>`;
    content.querySelector('.note-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      playerData.saveNote({ id: editingNoteId, title: String(form.get('title')).trim(), body: String(form.get('body')).trim() });
      editingNoteId = null;
      renderNotebook();
    });
    content.querySelector('[data-cancel-edit]')?.addEventListener('click', () => { editingNoteId = null; renderNotebook(); });
    content.querySelectorAll('[data-edit-note]').forEach((button) => button.addEventListener('click', () => { editingNoteId = button.dataset.editNote; renderNotebook(); }));
    content.querySelectorAll('[data-delete-note]').forEach((button) => button.addEventListener('click', () => { playerData.deleteNote(button.dataset.deleteNote); renderNotebook(); }));
  }
  function renderEvents() {
    const events = playerData.getEvents();
    content.innerHTML = `<section class="drawer-panel event-list">${events.length ? events.map((event) => `<article class="event-row"><span class="event-mark ${event.success ? 'is-success' : ''}">${event.type === 'stageUnlocked' ? '↗' : event.success ? '✓' : '!'}</span><div><strong>${event.type === 'stageUnlocked' ? t('stageUnlocked') : event.success ? t('stageCompleted') : t('stageFailed')} · ${t('stage')} ${event.stageIndex ?? ''}</strong><small>${escapeHtml(new Date(event.createdAt).toLocaleString(getLanguage() === 'ar' ? 'ar' : 'en'))}${event.type === 'stageAttempt' ? ` · ${t('score')} ${event.score}/100 · ${t('elapsed')} ${formatDuration(event.elapsedSeconds)}` : ''}</small></div></article>`).join('') : `<p class="empty-state">${t('noEvents')}</p>`}</section>`;
  }
  async function renderTools() {
    content.innerHTML = `<section class="drawer-panel"><p class="empty-state">${t('noTools')}</p></section>`;
    try {
      const catalog = await loadLearningCatalog();
      if (!host.isConnected || activePanel !== 'tools') return;
      const ids = new Set(playerData.getStudiedConcepts());
      stages.filter((stage) => progress.isStageCompleted(stage.stageId)).forEach((stage) => catalog.stages?.[stage.stageId]?.concepts?.forEach((id) => ids.add(id)));
      content.innerHTML = `<section class="drawer-panel concept-list">${ids.size ? [...ids].map((id) => { const concept = catalog.concepts[id]; return concept ? `<article class="concept-card"><span>✓</span><div><strong>${escapeHtml(concept.title[getLanguage()] ?? concept.title.ar)}</strong><small>${escapeHtml(concept.formula ?? '')}</small><p>${escapeHtml(concept.definition[getLanguage()] ?? concept.definition.ar)}</p></div></article>` : ''; }).join('') : `<p class="empty-state">${t('noTools')}</p>`}</section>`;
    } catch (error) {
      console.warn('[player-drawer] Could not load learning catalog:', error);
      if (host.isConnected && activePanel === 'tools') {
        content.innerHTML = `<section class="drawer-panel"><p class="empty-state">${t('noTools')}</p></section>`;
      }
    }
  }
  function renderAchievements() {
    const completedIds = stages.filter((stage) => progress.isStageCompleted(stage.stageId)).map((stage) => stage.stageId);
    const events = playerData.getEvents().filter((event) => event.type === 'stageAttempt');
    const earned = [
      ['firstMission', completedIds.length >= 1], ['fiveMissions', completedIds.length >= 5],
      ['noMistakes', events.some((event) => event.success && event.errorCount === 0)],
      ['finalMission', completedIds.includes('L3_S20_FinalCapstone')],
    ];
    content.innerHTML = `<section class="drawer-panel achievement-grid">${earned.map(([key, unlocked]) => `<article class="achievement-card ${unlocked ? 'is-earned' : ''}"><span>${unlocked ? '★' : '◇'}</span><strong>${t(key)}</strong><small>${unlocked ? t('done') : t('locked')}</small></article>`).join('')}</section>`;
  }
  function renderSettings() {
    const audio = getAudioSettings();
    const settings = playerData.getSettings();
    content.innerHTML = `
      <section class="drawer-panel settings-list">
        <label>${t('language')}<select data-language ${activeMission ? 'disabled' : ''}><option value="ar">${t('arabic')}</option><option value="en">${t('english')}</option></select></label>
        ${activeMission ? `<p class="hub-footnote">${getLanguage() === 'ar' ? 'غيّر اللغة بعد إنهاء المهمة لتجنب فقدان محاولتك الحالية.' : 'Change language after this mission to preserve your current attempt.'}</p>` : ''}
        <label class="setting-toggle"><span>${t('sound')}</span><input type="checkbox" data-sound ${audio.soundEnabled ? 'checked' : ''}></label>
        <label class="setting-toggle"><span>${t('music')}</span><input type="checkbox" data-music ${audio.musicEnabled ? 'checked' : ''}></label>
        <label class="setting-toggle"><span>${t('extraTime')}</span><input type="checkbox" data-extra-time ${settings.extraTime ? 'checked' : ''}></label>
        <p class="hub-footnote">${getLanguage() === 'ar' ? 'الموسيقى نغمة محيطية مولدة محليًا، ولا تعمل قبل أول تفاعل.' : 'Ambient music is generated locally and will not play before your first interaction.'}</p>
        <div class="drawer-storage-actions" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
          <button class="button button--secondary" type="button" data-toggle-review style="color:var(--brass);border-color:var(--brass);">
            ${progress.isReviewMode() ? (getLanguage() === 'ar' ? '🔓 وضع المراجعة: مفعّل (المراحل مفتوحة)' : '🔓 Review Mode: Active') : (getLanguage() === 'ar' ? '🔒 فتح كل المراحل للمراجعة' : '🔒 Unlock All for Review')}
          </button>
          <button class="button button--secondary" type="button" data-export-progress>${t('exportProgress')}</button>
          <label class="button button--secondary" style="display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <span>${t('importProgress')}</span>
            <input type="file" accept=".json,application/json" data-import-file style="display:none;" />
          </label>
          <button class="button button--secondary" type="button" data-reset-progress style="color:var(--hazard);border-color:var(--hazard);">${t('resetProgress')}</button>
        </div>
      </section>
    `;
    const language = content.querySelector('[data-language]');
    language.value = getLanguage();
    language.addEventListener('change', () => {
      setLanguage(language.value);
      if (onLanguageChange) onLanguageChange(language.value);
      else renderPanel();
    });
    content.querySelector('[data-sound]').addEventListener('change', (event) => setAudioSettings({ soundEnabled: event.target.checked }));
    content.querySelector('[data-music]').addEventListener('change', (event) => setAudioSettings({ musicEnabled: event.target.checked }));
    content.querySelector('[data-extra-time]').addEventListener('change', (event) => playerData.updateSettings({ extraTime: event.target.checked }));

    content.querySelector('[data-toggle-review]')?.addEventListener('click', () => {
      const next = !progress.isReviewMode();
      progress.setReviewMode(next);
      if (next) progress.unlockAllStages(stages.map((s) => s.stageId));
      renderPanel();
    });

    // Item 12: Export progress JSON file
    content.querySelector('[data-export-progress]').addEventListener('click', () => {
      const json = progress.exportProgress();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency-engineer-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Item 12: Import progress JSON file
    content.querySelector('[data-import-file]').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        const success = progress.importProgress(String(text));
        if (success) {
          alert(t('progressImportSuccess'));
          renderPanel();
        } else {
          alert(t('progressImportFailed'));
        }
      };
      reader.readAsText(file);
    });

    // Item 12: Reset progress with confirmation dialog
    content.querySelector('[data-reset-progress]').addEventListener('click', () => {
      if (confirm(t('resetConfirm'))) {
        progress.resetProgress();
        location.reload();
      }
    });
  }

  trigger.addEventListener('click', open);
  host.querySelector('[data-drawer-close]').addEventListener('click', close);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); });
  host.querySelectorAll('[data-panel]').forEach((button) => button.addEventListener('click', () => { activePanel = button.dataset.panel; editingNoteId = null; renderPanel(); }));
  host.addEventListener('keydown', (event) => {
    if (backdrop.hidden) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    // Item 17: Focus trap inside dialog
    if (event.key === 'Tab') {
      const focusables = Array.from(host.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function educationOptions() {
  return `<option value="unspecified">${t('levelUnspecified')}</option><option value="year1">${t('levelYear1')}</option><option value="year2">${t('levelYear2')}</option><option value="year3">${t('levelYear3')}</option><option value="master">${t('levelMaster')}</option>`;
}
function stageLabel(current, stages) {
  const stage = stages.find((item) => item.stageId === current.stageId);
  return `${t('stage')} ${current.stageIndexInLevel}: ${stage?.titleArabic ?? current.titleArabic ?? ''}`;
}
function formatDuration(seconds = 0) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function escapeAttr(value) { return escapeHtml(value); }
