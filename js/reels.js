import {
  state,
  ui,
  $,
  $$,
  icon,
  escapeHTML,
  linkify,
  formatCount,
  personById,
  isFollowing,
  avatarHTML,
  verifiedBadge,
  demoName,
  saveState,
  toast
} from './core.js';
import { hydrateMedia } from './media.js';

let reelObserver = null;
let reelRAF = null;
let lastVideosTab = false;

export function renderReels() {
  const view = $('.view[data-view="videos"]');
  if (!view) return;
  const videos = [...state.videos].sort((a, b) => b.createdAt - a.createdAt);

  if (!videos.length) {
    view.innerHTML = `
      <div class="reels-empty">
        <span class="empty-icon">${icon('i-reels')}</span>
        <b>قسم الفيديوهات بانتظارك</b>
        <p>ارفع فيديو قصيراً وشارك لحظتك مع الجميع.</p>
        <button class="btn btn-primary" type="button" data-action="open-video-upload">${icon('i-upload')} رفع فيديو</button>
      </div>`;
    return;
  }

  view.innerHTML = `
    <div class="reels-toolbar">
      <span class="reels-label">${icon('i-reels')} ريلز نبض</span>
      <button class="reel-chip is-solid" type="button" data-action="open-video-upload" aria-label="رفع فيديو">
        ${icon('i-upload')} رفع فيديو
      </button>
    </div>
    <div class="reels" id="reels">
      ${videos.map((video, index) => reelHTML(video, index, videos.length)).join('')}
    </div>
    <div class="reels-dots" aria-hidden="true">
      ${videos.map((video) => `<i data-dot="${video.id}" class="${ui.activeReelId === video.id ? 'is-on' : ''}"></i>`).join('')}
    </div>
  `;

  hydrateMedia(view);
  $$('.reel-video', view).forEach((videoEl) => {
    videoEl.muted = ui.muted;
    videoEl.addEventListener('timeupdate', () => {
      if (!Number.isFinite(videoEl.duration) || !videoEl.duration) return;
      const article = videoEl.closest('.reel');
      const bar = $('.reel-progress i', article);
      if (bar) bar.style.width = `${Math.min(100, (videoEl.currentTime / videoEl.duration) * 100)}%`;
    });
  });
  setupReelObserver();
  updateDots();
}

function reelHTML(video, index, total) {
  const author = personById(video.authorId) || {
    id: 'unknown', name: 'مستخدم نبض', handle: 'nabd', initial: 'ن',
    colors: ['#64748b', '#334155'], verified: false
  };
  const isOwn = video.authorId === 'me';
  return `
    <article class="reel" id="reel-${video.id}" data-reel-id="${video.id}" aria-label="${escapeHTML(video.title || 'فيديو')}">
      ${video.demo
        ? `<canvas class="reel-canvas" data-demo="${escapeHTML(video.demo)}" aria-hidden="true"></canvas>`
        : `<video class="reel-video" data-video="${escapeHTML(video.mediaKey || '')}" data-poster="${escapeHTML(video.posterKey || '')}" muted loop playsinline preload="metadata"></video>`}
      <div class="reel-vignette" aria-hidden="true"></div>
      <div class="reel-top">
        ${!video.demo ? `<button class="reel-chip is-glass" type="button" data-action="toggle-mute" aria-label="${ui.muted ? 'تشغيل الصوت' : 'كتم الصوت'}">${icon(ui.muted ? 'i-mute' : 'i-volume')}<span data-mute-label>${ui.muted ? 'مكتوم' : 'الصوت'}</span></button>` : `<span class="reel-chip is-glass">${icon('i-sparkle')} ${demoName(video.demo)}</span>`}
        <span class="reel-count" dir="ltr">${index + 1} / ${total}</span>
      </div>

      <div class="reel-side">
        <button class="reel-action like ${video.liked ? 'is-liked' : ''}" type="button" data-action="like-video" data-id="${video.id}" aria-label="إعجاب">
          ${icon(video.liked ? 'i-heart-fill' : 'i-heart')}
          <span>${formatCount(video.likes)}</span>
        </button>
        <button class="reel-action" type="button" data-action="video-comments" data-id="${video.id}" aria-label="التعليقات">
          ${icon('i-comment')}
          <span>${video.comments.length}</span>
        </button>
        <button class="reel-action" type="button" data-action="share-video" data-id="${video.id}" aria-label="مشاركة">
          ${icon('i-share')}
        </button>
        ${isOwn ? `<button class="reel-action danger" type="button" data-action="delete-video" data-id="${video.id}" aria-label="حذف الفيديو">${icon('i-trash')}</button>` : ''}
      </div>

      <div class="reel-info">
        <button class="reel-author" type="button" data-action="open-person" data-id="${author.id}">
          ${avatarHTML(author, 'avatar-sm')}
          <span class="reel-author-copy">
            <span class="reel-author-name">${escapeHTML(author.name)}${verifiedBadge(author)}</span>
            <span class="reel-author-handle">@${escapeHTML(author.handle || 'nabd')}</span>
          </span>
          <span class="reel-follow-chip">${isFollowing(author.id) || isOwn ? 'متابع' : 'متابعة'}</span>
        </button>
        <p class="reel-caption">${linkify(video.caption)}</p>
        <div class="reel-music">${icon('i-volume')}<span>${escapeHTML(video.music || 'صوت أصلي')}</span></div>
      </div>

      <div class="reel-progress"><i></i></div>
    </article>`;
}

export function setupReelObserver() {
  const root = $('#reels');
  if (!root) return;
  if (reelObserver) reelObserver.disconnect();
  reelObserver = new IntersectionObserver((entries) => {
    if (ui.tab !== 'videos') return;
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    const best = visible.reduce((a, b) => (a.intersectionRatio >= b.intersectionRatio ? a : b));
    if (best.intersectionRatio >= 0.55) activateReel(best.target.dataset.reelId);
  }, { root, threshold: [0.55, 0.7, 0.9] });
  $$('.reel', root).forEach((reel) => reelObserver.observe(reel));
}

export function activateReel(id) {
  if (!id || ui.tab !== 'videos') return;
  const article = document.getElementById(`reel-${id}`);
  if (!article) return;
  ui.activeReelId = id;
  lastVideosTab = true;
  updateDots();
  $$('.reel').forEach((reel) => reel.classList.toggle('is-active', reel === article));

  $$('.reel-video').forEach((video) => {
    if (video.closest('.reel') !== article) video.pause();
  });

  const video = article.querySelector('.reel-video');
  if (video) {
    video.muted = ui.muted;
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  cancelAnimation();
  const canvas = article.querySelector('.reel-canvas');
  if (canvas) startCanvas(canvas, id);
}

function startCanvas(canvas, id) {
  const started = performance.now();
  const draw = (now) => {
    if (ui.tab !== 'videos' || ui.activeReelId !== id) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth;
    const height = rect.height || canvas.clientHeight;
    if (!width || !height) {
      reelRAF = requestAnimationFrame(draw);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const seconds = (now - started) / 1000;
    drawDemo(canvas.dataset.demo, ctx, width, height, seconds);
    const article = canvas.closest('.reel');
    const bar = article?.querySelector('.reel-progress i');
    if (bar) bar.style.width = `${((seconds % 18) / 18) * 100}%`;
    reelRAF = requestAnimationFrame(draw);
  };
  reelRAF = requestAnimationFrame(draw);
}

function cancelAnimation() {
  if (reelRAF) cancelAnimationFrame(reelRAF);
  reelRAF = null;
}

export function stopReels() {
  cancelAnimation();
  lastVideosTab = false;
  $$('.reel-video').forEach((video) => video.pause());
}

export function pauseReels() {
  cancelAnimation();
  $$('.reel-video').forEach((video) => video.pause());
}

export function resumeReels() {
  if (ui.tab !== 'videos') return;
  const id = ui.activeReelId || state.videos[0]?.id;
  if (id) activateReel(id);
}

export function applyMute() {
  $$('.reel-video').forEach((video) => {
    video.muted = ui.muted;
  });
  $$('[data-mute-label]').forEach((label) => {
    label.textContent = ui.muted ? 'مكتوم' : 'الصوت';
  });
  $$('[data-action="toggle-mute"]').forEach((button) => {
    button.setAttribute('aria-label', ui.muted ? 'تشغيل الصوت' : 'كتم الصوت');
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', ui.muted ? '#i-mute' : '#i-volume');
  });
}

export function toggleVideoLike(id) {
  const video = state.videos.find((item) => item.id === id);
  if (!video) return;
  video.liked = !video.liked;
  video.likes = Math.max(0, video.likes + (video.liked ? 1 : -1));
  saveState();
  $$(`[data-action="like-video"][data-id="${id}"]`).forEach((button) => {
    button.classList.toggle('is-liked', video.liked);
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', video.liked ? '#i-heart-fill' : '#i-heart');
    const count = button.querySelector('span');
    if (count) count.textContent = formatCount(video.likes);
    button.classList.remove('pop');
    void button.offsetWidth;
    button.classList.add('pop');
  });
}

function updateDots() {
  $$('.reels-dots i').forEach((dot) => {
    dot.classList.toggle('is-on', dot.dataset.dot === ui.activeReelId);
  });
}

/* ------------------------------ Canvas art ---------------------------- */

function rand(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function vignette(ctx, w, h, strength = 0.55) {
  const gradient = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.2, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function stars(ctx, w, h, t, count = 34) {
  for (let i = 0; i < count; i += 1) {
    const x = rand(i + 1) * w;
    const y = rand(i + 90) * h * 0.4;
    const alpha = 0.18 + 0.6 * Math.abs(Math.sin(t * 0.9 + i * 0.7));
    const radius = 0.6 + rand(i + 200) * 1.5;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDemo(type, ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  if (type === 'dunes') drawDunes(ctx, w, h, t);
  else if (type === 'neon') drawNeon(ctx, w, h, t);
  else if (type === 'ocean') drawOcean(ctx, w, h, t);
  else if (type === 'city') drawCity(ctx, w, h, t);
  else drawNeon(ctx, w, h, t);
}

function drawDunes(ctx, w, h, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.82);
  sky.addColorStop(0, '#160f33');
  sky.addColorStop(0.32, '#4b2563');
  sky.addColorStop(0.58, '#a84366');
  sky.addColorStop(0.78, '#ef765e');
  sky.addColorStop(1, '#ffc873');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.68;
  const sunY = h * 0.43;
  const sunR = Math.max(24, w * 0.082);
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(w, h) * 0.34);
  glow.addColorStop(0, 'rgba(255,235,180,0.85)');
  glow.addColorStop(0.25, 'rgba(255,190,120,0.35)');
  glow.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = '#ffe6a8';
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  stars(ctx, w, h, t, 30);

  ctx.strokeStyle = 'rgba(28,15,42,0.62)';
  ctx.lineWidth = 1.4;
  for (let b = 0; b < 3; b += 1) {
    const bx = w * (0.18 + rand(b + 4) * 0.55) + Math.sin(t * 0.3 + b) * w * 0.04;
    const by = h * (0.19 + rand(b + 30) * 0.12);
    const size = 4 + rand(b + 70) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - size, by);
    ctx.quadraticCurveTo(bx - size / 2, by - size * 0.8, bx, by);
    ctx.quadraticCurveTo(bx + size / 2, by - size * 0.8, bx + size, by);
    ctx.stroke();
  }

  const layers = [
    { base: 0.62, amp: 0.03, phase: 0.2, top: '#a84e69', bottom: '#6a2c53' },
    { base: 0.71, amp: 0.042, phase: 1.9, top: '#7c3459', bottom: '#421d3f' },
    { base: 0.82, amp: 0.052, phase: 3.6, top: '#3a1a3d', bottom: '#160d23' }
  ];

  layers.forEach((layer, index) => {
    const baseY = h * layer.base;
    const amp = h * layer.amp;
    const gradient = ctx.createLinearGradient(0, baseY - amp, 0, h);
    gradient.addColorStop(0, layer.top);
    gradient.addColorStop(1, layer.bottom);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= w + 8; x += 8) {
      const y = baseY
        + Math.sin((x / w) * Math.PI * 2 + t * 0.12 + layer.phase) * amp
        + Math.sin((x / w) * Math.PI * 5 + layer.phase) * amp * 0.28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    if (index === 2) {
      ctx.beginPath();
      for (let x = 0; x <= w + 8; x += 8) {
        const y = baseY
          + Math.sin((x / w) * Math.PI * 2 + t * 0.12 + layer.phase) * amp
          + Math.sin((x / w) * Math.PI * 5 + layer.phase) * amp * 0.28;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,200,140,0.22)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  });

  const haze = ctx.createLinearGradient(0, h * 0.56, 0, h * 0.72);
  haze.addColorStop(0, 'rgba(255,170,120,0.18)');
  haze.addColorStop(1, 'rgba(255,170,120,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.56, w, h * 0.16);
  vignette(ctx, w, h, 0.5);
}

function drawNeon(ctx, w, h, t) {
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  bg.addColorStop(0, '#15112e');
  bg.addColorStop(0.55, '#080713');
  bg.addColorStop(1, '#030308');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(110,110,170,0.13)';
  ctx.lineWidth = 1;
  const horizon = h * 0.74;
  for (let i = 1; i <= 6; i += 1) {
    const y = horizon + (h - horizon) * (i / 6) * (i / 6);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = -6; i <= 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * w * 0.04, horizon);
    ctx.lineTo(w / 2 + i * w * 0.32, h);
    ctx.stroke();
  }
  ctx.restore();

  const colors = ['#22d3ee', '#ff2d78', '#a855f7', '#38bdf8'];
  for (let line = 0; line < 4; line += 1) {
    const color = colors[line];
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 + line * 0.7;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let x = -10; x <= w + 10; x += 8) {
      const y = h * (0.32 + line * 0.12)
        + Math.sin(x * 0.013 + t * (0.55 + line * 0.2) + line * 1.7) * (28 + line * 15)
        + Math.sin(x * 0.033 - t * 0.9) * 7;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${0.18 + pulse * 0.22})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.47, w * (0.22 + pulse * 0.02), 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(168,85,247,0.35)';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.47, w * (0.31 + pulse * 0.025), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 26; i += 1) {
    const x = (rand(i + 12) * w + t * (6 + rand(i) * 14)) % w;
    const y = rand(i + 44) * h;
    const alpha = 0.2 + 0.5 * Math.abs(Math.sin(t + i));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + rand(i + 90) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  vignette(ctx, w, h, 0.42);
}

function drawOcean(ctx, w, h, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#040a1a');
  sky.addColorStop(0.55, '#0b1d3a');
  sky.addColorStop(1, '#1c3358');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  stars(ctx, w, h, t, 46);

  const moonX = w * 0.7;
  const moonY = h * 0.22;
  const moonR = Math.max(18, w * 0.058);
  const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 6);
  glow.addColorStop(0, 'rgba(255,248,220,0.72)');
  glow.addColorStop(0.25, 'rgba(255,246,210,0.2)');
  glow.addColorStop(1, 'rgba(255,246,210,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = '#fff6da';
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();

  const sea = ctx.createLinearGradient(0, h * 0.48, 0, h);
  sea.addColorStop(0, '#1b3354');
  sea.addColorStop(0.55, '#0b1a33');
  sea.addColorStop(1, '#030712');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.48, w, h * 0.52);

  const reflection = ctx.createLinearGradient(moonX, h * 0.48, moonX, h * 0.92);
  reflection.addColorStop(0, 'rgba(255,246,210,0.35)');
  reflection.addColorStop(1, 'rgba(255,246,210,0)');
  ctx.fillStyle = reflection;
  ctx.beginPath();
  ctx.moveTo(moonX - moonR * 0.7, h * 0.48);
  ctx.lineTo(moonX + moonR * 0.7, h * 0.48);
  ctx.lineTo(moonX + moonR * 2.4, h * 0.95);
  ctx.lineTo(moonX - moonR * 2.4, h * 0.95);
  ctx.closePath();
  ctx.fill();

  for (let band = 0; band < 10; band += 1) {
    const baseY = h * 0.5 + band * (h * 0.052);
    const amp = 2.5 + band * 1.6;
    ctx.beginPath();
    for (let x = -8; x <= w + 8; x += 6) {
      const y = baseY
        + Math.sin(x * 0.014 + t * (0.6 + band * 0.05) + band * 0.8) * amp
        + Math.sin(x * 0.04 - t * 0.8) * amp * 0.35;
      if (x === -8) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(150,195,255,${0.05 + band * 0.025})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const x = moonX + (rand(i + 5) - 0.5) * w * 0.34;
    const y = h * (0.55 + rand(i + 60) * 0.32);
    const len = 8 + rand(i + 20) * 30;
    const alpha = 0.08 + 0.22 * Math.abs(Math.sin(t * 1.3 + i));
    ctx.strokeStyle = `rgba(255,240,200,${alpha})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }

  const haze = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.5);
  haze.addColorStop(0, 'rgba(140,180,255,0)');
  haze.addColorStop(0.5, 'rgba(140,180,255,0.12)');
  haze.addColorStop(1, 'rgba(140,180,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.42, w, h * 0.09);
  vignette(ctx, w, h, 0.48);
}

function drawCity(ctx, w, h, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
  sky.addColorStop(0, '#040a1c');
  sky.addColorStop(0.4, '#0d1734');
  sky.addColorStop(0.72, '#262752');
  sky.addColorStop(1, '#603c60');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  stars(ctx, w, h, t, 30);

  const moonX = w * 0.75;
  const moonY = h * 0.19;
  const moonR = Math.max(16, w * 0.05);
  const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 6);
  glow.addColorStop(0, 'rgba(255,244,205,0.6)');
  glow.addColorStop(1, 'rgba(255,244,205,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = '#fff3d2';
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();

  const baseY = h * 0.7;
  const count = 15;
  for (let i = 0; i < count; i += 1) {
    const bw = w * (0.045 + rand(i + 3) * 0.045);
    const bx = (i / count) * w - w * 0.02;
    const bh = h * (0.1 + rand(i + 20) * 0.24);
    const top = baseY - bh;
    const shade = 16 + Math.floor(rand(i + 50) * 14);
    ctx.fillStyle = `rgb(${shade},${shade + 8},${shade + 26})`;
    ctx.fillRect(bx, top, bw, bh);
    const cols = Math.max(2, Math.floor(bw / 9));
    const rows = Math.max(3, Math.floor(bh / 16));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const lit = rand(i * 31 + c * 7 + r * 3) > 0.45;
        const blink = Math.sin(t * 1.2 + i + c + r) > -0.85;
        if (!lit || !blink) continue;
        ctx.fillStyle = `rgba(255,208,120,${0.28 + 0.42 * rand(i + c + r)})`;
        ctx.fillRect(bx + 3 + c * (bw - 6) / cols, top + 5 + r * (bh - 10) / rows, 2.2, 3.4);
      }
    }
  }

  ctx.fillStyle = '#050711';
  ctx.fillRect(0, baseY, w, h - baseY);

  const water = ctx.createLinearGradient(0, baseY, 0, h);
  water.addColorStop(0, 'rgba(24,36,72,0.95)');
  water.addColorStop(1, '#03050d');
  ctx.fillStyle = water;
  ctx.fillRect(0, baseY, w, h - baseY);

  const reflection = ctx.createLinearGradient(moonX, baseY, moonX, h);
  reflection.addColorStop(0, 'rgba(255,240,200,0.3)');
  reflection.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = reflection;
  ctx.beginPath();
  ctx.moveTo(moonX - moonR, baseY);
  ctx.lineTo(moonX + moonR, baseY);
  ctx.lineTo(moonX + moonR * 3.2, h);
  ctx.lineTo(moonX - moonR * 3.2, h);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 22; i += 1) {
    const y = baseY + 6 + rand(i + 9) * (h - baseY) * 0.9;
    const x = rand(i + 70) * w;
    const len = w * (0.05 + rand(i + 2) * 0.18);
    const alpha = 0.04 + 0.1 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.strokeStyle = `rgba(255,210,130,${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  vignette(ctx, w, h, 0.46);
}
