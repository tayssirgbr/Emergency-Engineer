// Emergency Engineer — first-run student name entry.
import { t, setLanguage } from '../i18n.js';

/**
 * @param {HTMLElement} container
 * @param {{ onSubmit: (name: string) => void }} options
 */
export function renderNameEntryScreen(container, { onSubmit, onLanguageChange }) {
  container.innerHTML = `
    <div class="menu-screen">
      <section class="menu-plate glass-panel name-entry-card">
        <div class="brand-mark" aria-hidden="true"><span>H₂O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC / EMERGENCY RESPONSE</p>
        <h1 class="menu-title">${t('appName')}</h1>
        <form class="name-form" data-role="name-form">
          <label class="name-label" for="student-name">${t('playerName')}</label>
          <input
            class="name-input"
            id="student-name"
            type="text"
            placeholder="${t('playerName')}"
            autocomplete="off"
            required
          />
          <label class="name-label" for="education-level">${t('educationLevel')}</label>
          <select class="name-input" id="education-level" name="educationLevel">
            <option value="unspecified">${t('levelUnspecified')}</option><option value="year1">${t('levelYear1')}</option><option value="year2">${t('levelYear2')}</option><option value="year3">${t('levelYear3')}</option><option value="master">${t('levelMaster')}</option>
          </select>
          <button class="button button--primary" type="submit">${t('continue')}</button>
        </form>
        <button class="language-switch" data-language>${t('language')}: ${t('arabic')} / ${t('english')}</button>
      </section>
    </div>
  `;

  const form = container.querySelector('[data-role="name-form"]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = container.querySelector('#student-name');
    const name = input.value.trim();
    if (!name) return;
    onSubmit(name, container.querySelector('#education-level').value);
  });
  container.querySelector('[data-language]').addEventListener('click', () => {
    setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
    onLanguageChange?.();
  });
}
