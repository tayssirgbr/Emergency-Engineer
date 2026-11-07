import { t } from '../i18n.js';
import { playErrorSound, playSuccessSound } from '../audio-manager.js';

export function showFeedbackToast(container, { correct, message = '', detail = '', delta = null }) {
  // Screen routers replace #app's children. Mount on body so a final-answer
  // notification survives the immediate transition to the result screen.
  const target = document.body;
  document.querySelectorAll('.feedback-toast').forEach((existing) => existing.remove());
  const toast = document.createElement('section');
  toast.className = `feedback-toast feedback-toast--${correct ? 'success' : 'error'}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const deltaText = delta === null ? '' : `<span class="toast-delta">${delta > 0 ? '+' : ''}${delta} ${t('score')}</span>`;
  toast.innerHTML = `<div class="toast-icon" aria-hidden="true">${correct ? '✓' : '!'}</div><div class="toast-copy"><strong>${correct ? t('success') : t('wrong')}</strong><p>${escapeHtml(message || (correct ? t('earned') : t('missed')))}</p>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>${deltaText}<button type="button" class="toast-close" aria-label="${t('closeToast')}">×</button>`;
  target.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  window.setTimeout(() => toast.remove(), 4200);
  if (correct) playSuccessSound(); else playErrorSound();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
