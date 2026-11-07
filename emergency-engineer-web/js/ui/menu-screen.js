// Emergency Engineer — main menu screen.
import { t } from '../i18n.js';
import { mountPlayerDrawer } from './player-drawer.js';

/**
 * @param {HTMLElement} container
 * @param {{ studentName?: string, onPlay: () => void }} options
 */
export function renderMenuScreen(container, { studentName, stages = [], onPlay, onAbout, onLanguageChange }) {
  container.innerHTML = `
    <main class="menu-screen">
      <div class="menu-grid-glow" aria-hidden="true"></div>
      <section class="menu-plate glass-panel">
        <div class="brand-mark" aria-hidden="true"><span>H₂O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC / EMERGENCY RESPONSE</p>
        <h1 class="menu-title">${t('appName')}</h1>
        <p class="menu-subtitle">${t('welcomeText')}</p>
        ${studentName ? `<p class="menu-welcome">${t('welcome')}، ${escapeHtml(studentName)}</p>` : ''}
        <div class="menu-actions"><button class="button button--primary" data-action="play">${t('play')} <span aria-hidden="true">↗</span></button><button class="button button--secondary" data-action="about">${t('about')}</button></div>
        <div class="menu-signal"><span></span> SYSTEM READY <b>●</b></div>
      </section>
    </main>
  `;

  container.querySelector('[data-action="play"]').addEventListener('click', () => onPlay());
  container.querySelector('[data-action="about"]').addEventListener('click', () => onAbout?.());
  mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
