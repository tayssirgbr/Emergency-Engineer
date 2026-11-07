// PWA setup and optional install affordance. It does not touch game state.
let installPrompt = null;
const DISMISSED_KEY = 'emergencyEngineer:pwaInstallDismissed';

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wasDismissed() {
  try { return localStorage.getItem(DISMISSED_KEY) === 'true'; }
  catch { return false; }
}

function removeInstallCard() {
  document.querySelector('[data-pwa-install]')?.remove();
}

function mountInstallCard() {
  const menu = document.querySelector('.menu-plate');
  if (!menu || isStandalone() || wasDismissed() || (!installPrompt && !isAppleMobile())) return;
  if (menu.querySelector('[data-pwa-install]')) return;

  const isArabic = document.documentElement.lang === 'ar';
  const card = document.createElement('aside');
  card.className = 'pwa-install';
  card.dataset.pwaInstall = '';
  card.innerHTML = `
    <div class="pwa-install__copy">
      <strong>${isArabic ? 'ثبّت اللعبة على جهازك' : 'Install the game on your device'}</strong>
      <p data-pwa-install-help>${isArabic
        ? (isAppleMobile() ? 'أضفها إلى الشاشة الرئيسية لفتحها كتطبيق.' : 'افتحها كتطبيق مستقل من شاشتك الرئيسية.')
        : (isAppleMobile() ? 'Add it to your Home Screen to open it like an app.' : 'Open it as a standalone app from your home screen.')}</p>
    </div>
    <button class="pwa-install__action" type="button" data-pwa-install-action>${isArabic
      ? (isAppleMobile() ? 'طريقة الإضافة' : 'تثبيت اللعبة')
      : (isAppleMobile() ? 'How to add' : 'Install game')}</button>
    <button class="pwa-install__dismiss" type="button" aria-label="${isArabic ? 'إخفاء' : 'Dismiss'}" data-pwa-install-dismiss>×</button>`;

  const actions = menu.querySelector('.menu-actions');
  (actions?.parentElement ?? menu).insertBefore(card, actions?.nextSibling ?? null);
  card.querySelector('[data-pwa-install-action]').addEventListener('click', async () => {
    if (isAppleMobile()) {
      const help = card.querySelector('[data-pwa-install-help]');
      help.textContent = isArabic
        ? 'في Safari: اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية». '
        : 'In Safari, tap Share, then “Add to Home Screen”.';
      return;
    }
    if (!installPrompt) return;
    const promptEvent = installPrompt;
    installPrompt = null;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') removeInstallCard();
  });
  card.querySelector('[data-pwa-install-dismiss]').addEventListener('click', () => {
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch { /* Storage may be unavailable. */ }
    removeInstallCard();
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  mountInstallCard();
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  removeInstallCard();
});

window.addEventListener('pageshow', mountInstallCard);
window.addEventListener('pwa-install-availability', mountInstallCard);
new MutationObserver(mountInstallCard).observe(document.getElementById('app'), { childList: true, subtree: true });

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => console.warn('[pwa] Service worker unavailable:', error));
  }, { once: true });
}
