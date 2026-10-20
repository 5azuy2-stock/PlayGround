import {
  PEOPLE,
  createSeedPosts,
  createSeedVideos,
  createSeedChats
} from './data.js';

export const STORAGE_KEY = 'nabd:state:v1';
export const MAX_POST_CHARS = 500;
export const MAX_AVATAR_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function randomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(8);
  if (crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 8; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => chars[b % chars.length]).join('');
}

function defaultState() {
  const now = Date.now();
  return {
    version: 1,
    me: {
      id: randomId(),
      name: 'ليان',
      handle: 'layan',
      bio: 'أشارك اللحظات، الأفكار، وكل ما يستحق النبض ✨',
      avatar: null,
      colors: ['#ff8a3d', '#ff2d78', '#8b5cf6'],
      initial: 'ل',
      joinedAt: now
    },
    stats: { followers: 1248, following: 386, friends: 42 },
    relations: {
      following: ['R3EM2026', 'LAMA8S21', 'DANA6X24'],
      followers: ['R3EM2026', 'K4LD7X21', 'LAMA8S21', 'F9SAL321', 'DANA6X24'],
      friends: ['R3EM2026', 'LAMA8S21']
    },
    posts: createSeedPosts(now),
    videos: createSeedVideos(now),
    chats: createSeedChats(now),
    games: {
      memory: { bestMoves: null, bestTime: null },
      xo: { wins: 0, losses: 0, draws: 0 },
      rps: { wins: 0, losses: 0, draws: 0 }
    },
    notificationsRead: false,
    joinedAt: now
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultState();
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      me: { ...base.me, ...(parsed.me || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      relations: { ...base.relations, ...(parsed.relations || {}) },
      games: {
        ...base.games,
        ...(parsed.games || {}),
        memory: { ...base.games.memory, ...((parsed.games || {}).memory || {}) },
        xo: { ...base.games.xo, ...((parsed.games || {}).xo || {}) },
        rps: { ...base.games.rps, ...((parsed.games || {}).rps || {}) }
      }
    };
  } catch {
    return defaultState();
  }
}

export const state = loadState();

export const ui = {
  tab: 'account',
  feedFilter: 'all',
  profileTab: 'posts',
  openComments: new Set(),
  chatQuery: '',
  chatId: null,
  composerText: '',
  composerImage: null,
  videoDraft: null,
  avatarDraft: null,
  lookupId: null,
  muted: true,
  activeReelId: null,
  pendingReelFocus: null,
  typingChats: new Set()
};

export const pendingReplies = new Map();
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function toastRoot() {
  return $('#toast-root');
}

export function icon(name, cls = 'ic') {
  return `<svg class="${cls}" aria-hidden="true"><use href="#${name}"></use></svg>`;
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

export function clip(value, length) {
  const text = String(value || '').trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function linkify(text) {
  let safe = escapeHTML(text || '');
  safe = safe.replace(/(^|[\s(])(#[\p{L}\p{N}_]+)/gu, '$1<span class="hashtag">$2</span>');
  safe = safe.replace(/(^|[\s(])(@[A-Za-z0-9_]+)/g, '$1<span class="mention">$2</span>');
  return safe.replace(/\n/g, '<br>');
}

export function formatCount(number) {
  const n = Number(number) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.0', '')} م`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')} ألف`;
  return String(n);
}

export function timeAgo(timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} ي`;
  return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

export function clockTime(timestamp) {
  const date = new Date(timestamp);
  let hours = date.getHours();
  const suffix = hours < 12 ? 'ص' : 'م';
  hours = hours % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
}

export function dateLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'اليوم';
  if (sameDay(date, yesterday)) return 'أمس';
  return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long' }).format(date);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('تعذر حفظ البيانات على هذا الجهاز', 'error');
  }
}

export function personById(id) {
  if (id === 'me' || id === state.me.id) {
    return { ...state.me, isMe: true, verified: true, online: true };
  }
  return PEOPLE.find((person) => person.id === id) || null;
}

export function findPersonByCode(code) {
  if (code === state.me.id || code === 'me') return personById('me');
  return PEOPLE.find((item) => item.id === code) || null;
}

export function isFollowing(id) {
  return state.relations.following.includes(id);
}

export function isFriend(id) {
  return state.relations.friends.includes(id);
}

export function avatarHTML(person, extraClass = '', options = {}) {
  if (!person) person = { name: 'مستخدم نبض', initial: 'ن', colors: ['#555', '#777'] };
  const colors = person.colors || ['#ff6a3d', '#8b5cf6'];
  const initial = person.initial || String(person.name || 'ن').trim().charAt(0) || 'ن';
  const image = person.avatar ? `<img data-media="${escapeHTML(person.avatar)}" alt="" />` : '';
  return `<span class="avatar ${extraClass}" style="--a:${colors[0]};--b:${colors[1]}" aria-hidden="true">${escapeHTML(initial)}${image}${options.online ? '<i class="online-dot"></i>' : ''}</span>`;
}

export function verifiedBadge(person) {
  if (!person?.verified) return '';
  return `<span class="verified" title="حساب موثّق" aria-label="حساب موثّق">${icon('i-check')}</span>`;
}

const UNKNOWN_PERSON = {
  id: 'unknown',
  name: 'مستخدم نبض',
  handle: 'nabd',
  initial: 'ن',
  colors: ['#64748b', '#334155'],
  verified: false,
  online: false
};

export function postAuthor(post) {
  const person = post.authorId === 'me' ? personById('me') : personById(post.authorId);
  return person || UNKNOWN_PERSON;
}

export function postImageHTML(post, className = '') {
  if (post.image) {
    return `<img class="${className}" src="${escapeHTML(post.image)}" alt="" loading="lazy" />`;
  }
  if (post.imageKey) {
    return `<img class="${className}" data-media="${escapeHTML(post.imageKey)}" alt="" loading="lazy" />`;
  }
  return '';
}

export function videoPosterHTML(video, className = '') {
  if (video.posterKey) {
    return `<img class="${className}" data-media="${escapeHTML(video.posterKey)}" alt="" loading="lazy" />`;
  }
  if (video.demo) {
    return `<span class="demo-poster demo-${escapeHTML(video.demo)} ${className}"></span>`;
  }
  return `<span class="demo-poster demo-generic ${className}"></span>`;
}

export function demoName(type) {
  return ({ dunes: 'غروب', neon: 'نيون', ocean: 'محيط', city: 'مدينة' })[type] || 'ريل';
}

export function feedPosts() {
  const sorted = [...state.posts].sort((a, b) => b.createdAt - a.createdAt);
  if (ui.feedFilter === 'following') {
    return sorted.filter((post) => post.authorId === 'me' || state.relations.following.includes(post.authorId));
  }
  if (ui.feedFilter === 'friends') {
    return sorted.filter((post) => post.authorId === 'me' || state.relations.friends.includes(post.authorId));
  }
  return sorted;
}

export function toast(message, kind = 'ok') {
  const root = toastRoot();
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${kind === 'error' ? 'is-error' : ''}`;
  el.innerHTML = `${icon(kind === 'error' ? 'i-close' : 'i-check')}<span>${escapeHTML(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => el.classList.add('is-out'), 2400);
  setTimeout(() => el.remove(), 2900);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareContent(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      return;
    }
  }
  const ok = await copyText(`${text}\n${location.href}`);
  toast(ok ? 'تم نسخ المحتوى للمشاركة' : 'تعذر النسخ على هذا الجهاز', ok ? 'ok' : 'error');
}

export function updateBadges() {
  const unread = state.chats.reduce((total, chat) => total + (chat.unread || 0), 0);
  const msgBadge = $('#msg-badge');
  if (msgBadge) {
    msgBadge.hidden = unread === 0;
    msgBadge.textContent = unread > 9 ? '٩+' : String(unread);
  }
  const notifDot = $('#notif-dot');
  if (notifDot) notifDot.hidden = Boolean(state.notificationsRead);
}
