import { ui, saveState } from './core.js';
import { renderAll, navigate } from './views.js';
import { initActions } from './actions.js';
import { applyMute } from './reels.js';

function boot() {
  initActions();
  renderAll();
  navigate(ui.tab || 'account');
  applyMute();
  saveState();

  const splash = document.getElementById('boot');
  requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
    if (splash) {
      splash.classList.add('is-done');
      setTimeout(() => splash.remove(), 700);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
