import { getLanguage, t } from '../i18n.js';

export function renderWelcomeScreen(container, { studentName, onStart, onAbout }) {
  container.innerHTML = `
    <main class="welcome-screen">
      <section class="welcome-card glass-panel">
        <div class="brand-mark" aria-hidden="true"><span>H₂O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC EMERGENCY ENGINEER</p>
        <h1>${t('welcome')}${studentName ? `، ${escapeHtml(studentName)}` : ''}</h1>
        <p class="welcome-copy">${t('welcomeText')}</p>
        <div class="welcome-actions">
          <button class="button button--primary" data-action="start">${t('start')} <span aria-hidden="true">↗</span></button>
          <button class="button button--secondary" data-action="about">${t('about')}</button>
          <button class="text-button" data-action="skip">${t('skipIntro')}</button>
        </div>
      </section>
    </main>`;
  container.querySelector('[data-action="start"]').addEventListener('click', onStart);
  container.querySelector('[data-action="skip"]').addEventListener('click', onStart);
  container.querySelector('[data-action="about"]').addEventListener('click', onAbout);
}

export function renderAboutScreen(container, { studentName, onBack, onStart }) {
  const language = getLanguage();
  const steps = language === 'ar'
    ? ['اقرأ الحالة والقياسات.', 'حلّل البيانات واختر الإجراء.', 'برر القرار وتعلم من الملاحظات.', 'أكمل المهمة لفتح المرحلة التالية.']
    : ['Read the situation and measurements.', 'Analyze the data and choose an action.', 'Justify your decision and learn from feedback.', 'Complete the mission to unlock the next stage.'];
  container.innerHTML = `
    <main class="about-screen">
      <section class="about-card glass-panel">
        <button class="icon-button about-back" data-action="back" aria-label="${t('back')}">←</button>
        <p class="eyebrow">HYDRAULIC EMERGENCY ENGINEER</p>
        <h1>${t('aboutTitle')}</h1>
        <p>${t('aboutBody')}</p>
        <ol class="guide-steps">${steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span>${step}</li>`).join('')}</ol>
        <div class="learning-note">${t('aboutProgress')}<br/>${t('aboutTools')}</div>
        <div class="welcome-actions"><button class="button button--primary" data-action="start">${t('start')}</button><button class="button button--secondary" data-action="back">${t('back')}</button></div>
      </section>
    </main>`;
  container.querySelectorAll('[data-action="back"]').forEach((button) => button.addEventListener('click', onBack));
  container.querySelector('[data-action="start"]').addEventListener('click', onStart);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
