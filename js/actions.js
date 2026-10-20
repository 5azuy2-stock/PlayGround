import {
  state,
  ui,
  $,
  $$,
  escapeHTML,
  saveState,
  toast,
  copyText,
  shareContent,
  uid,
  MAX_AVATAR_BYTES,
  MAX_VIDEO_BYTES
} from './core.js';
import {
  putMedia,
  compressImage,
  createVideoPoster,
  fileSizeLabel,
  hydrateMedia
} from './media.js';
import {
  renderAccount,
  renderPosts,
  navigate,
  focusPost,
  focusVideo,
  autosize,
  postCommentsHTML,
  chatRowsHTML
} from './views.js';
import { openGame, closeGame, isGameOpen } from './games.js';
import {
  renderReels,
  stopReels,
  activateReel,
  resumeReels,
  applyMute,
  toggleVideoLike
} from './reels.js';
import {
  openChat,
  closeChatScreen,
  sendChatMessage,
  messageUser
} from './chat.js';
import {
  openAddSheet,
  renderLookupResult,
  openStatsSheet,
  openPersonSheet,
  openNotificationsSheet,
  openEditProfileSheet,
  openVideoUploadSheet,
  openVideoCommentsSheet,
  refreshVideoComments,
  openPostOptions,
  openDeleteVideoSheet,
  openNewChatSheet,
  closeSheet,
  toggleFollow,
  toggleFriend,
  copyIdAction
} from './sheets.js';

let bound = false;

export function initActions() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('error', (event) => {
    if (event.target?.matches?.('img[data-media]')) event.target.remove();
  }, true);
}

function onClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === 'backdrop') {
    if (event.target === actionEl) closeSheet();
    return;
  }

  switch (action) {
    case 'nav':
      navigate(actionEl.dataset.tab);
      break;
    case 'close-sheet':
      closeSheet();
      break;
    case 'close-chat':
      closeChatScreen();
      break;
    case 'open-add':
      openAddSheet(actionEl.dataset.id || '');
      break;
    case 'fill-id': {
      const id = actionEl.dataset.id || '';
      const input = $('#add-id-input');
      if (input) {
        input.value = id;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      renderLookupResult(id);
      requestAnimationFrame(() => $('#add-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      break;
    }
    case 'copy-id':
      copyIdAction(actionEl.dataset.id || null);
      break;
    case 'share-profile':
      shareContent(`ملف ${state.me.name} على نبض`, `تابعني على نبض — معرّفي: ${state.me.id}`);
      break;
    case 'edit-profile':
      openEditProfileSheet();
      break;
    case 'open-stats':
      openStatsSheet(actionEl.dataset.stat || 'followers');
      break;
    case 'open-person':
      openPersonSheet(actionEl.dataset.id);
      break;
    case 'toggle-follow':
      toggleFollow(actionEl.dataset.id);
      break;
    case 'toggle-friend':
      toggleFriend(actionEl.dataset.id);
      break;
    case 'message-person':
      closeSheet(true);
      navigate('messages');
      messageUser(actionEl.dataset.id);
      break;
    case 'open-notifications':
      openNotificationsSheet();
      break;
    case 'open-chat':
      openChat(actionEl.dataset.id);
      break;
    case 'new-chat':
      openNewChatSheet();
      break;
    case 'open-video-upload':
      openVideoUploadSheet();
      break;
    case 'toggle-mute':
      ui.muted = !ui.muted;
      applyMute();
      break;
    case 'like-video':
      toggleVideoLike(actionEl.dataset.id);
      break;
    case 'video-comments':
      openVideoCommentsSheet(actionEl.dataset.id);
      break;
    case 'share-video': {
      const video = state.videos.find((item) => item.id === actionEl.dataset.id);
      if (video) shareContent(video.title || 'ريل على نبض', video.caption || 'شاهد هذا الريل على نبض');
      break;
    }
    case 'delete-video':
      openDeleteVideoSheet(actionEl.dataset.id);
      break;
    case 'confirm-delete-video':
      deleteVideo(actionEl.dataset.id);
      break;
    case 'like-post':
      togglePostLike(actionEl.dataset.id);
      break;
    case 'toggle-comments':
      togglePostComments(actionEl.dataset.id);
      break;
    case 'share-post': {
      const post = state.posts.find((item) => item.id === actionEl.dataset.id);
      if (post) shareContent('منشور على نبض', post.text || 'شاهد هذا المنشور على نبض');
      break;
    }
    case 'save-post':
      toggleSavedPost(actionEl.dataset.id);
      break;
    case 'post-options':
      openPostOptions(actionEl.dataset.id);
      break;
    case 'confirm-delete-post':
      deletePost(actionEl.dataset.id);
      break;
    case 'copy-post': {
      const post = state.posts.find((item) => item.id === actionEl.dataset.id);
      if (post) {
        copyText(post.text || '').then((ok) => toast(ok ? 'تم نسخ نص المنشور' : 'تعذر النسخ', ok ? 'ok' : 'error'));
      }
      break;
    }
    case 'attach-post-image':
      $('#post-image-input')?.click();
      break;
    case 'remove-post-image':
      if (ui.composerImage?.url) URL.revokeObjectURL(ui.composerImage.url);
      ui.composerImage = null;
      renderPosts();
      break;
    case 'filter-feed':
      ui.feedFilter = actionEl.dataset.filter || 'all';
      renderPosts();
      break;
    case 'profile-tab':
      ui.profileTab = actionEl.dataset.tab || 'posts';
      renderAccount();
      break;
    case 'focus-post':
      focusPost(actionEl.dataset.id);
      break;
    case 'focus-video':
      focusVideo(actionEl.dataset.id);
      break;
    case 'open-game':
      openGame(actionEl.dataset.game, {
        getState: () => state,
        saveState,
        toast,
        stopReels,
        onClose: () => {
          if (ui.tab === 'videos') resumeReels();
        }
      });
      break;
    default:
      break;
  }
}

async function onSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'find-id') {
    const input = $('#add-id-input');
    const code = (input?.value || '').toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      toast('المعرّف يجب أن يكون ٨ أحرف إنجليزية أو أرقام', 'error');
      input?.focus();
      return;
    }
    renderLookupResult(code);
    requestAnimationFrame(() => $('#add-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    return;
  }

  if (kind === 'create-post') {
    await createPost(form);
    return;
  }

  if (kind === 'add-comment') {
    addComment(form);
    return;
  }

  if (kind === 'add-video-comment') {
    addVideoComment(form);
    return;
  }

  if (kind === 'send-message') {
    sendChatMessage(form);
    return;
  }

  if (kind === 'upload-video') {
    await uploadVideo(form);
    return;
  }

  if (kind === 'edit-profile') {
    await saveProfile(form);
  }
}

function onInput(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

  if (el.id === 'post-text') {
    ui.composerText = el.value;
    const counter = $('#post-counter');
    if (counter) counter.textContent = `${el.value.length}/500`;
    autosize(el);
    return;
  }

  if (el.id === 'chat-search') {
    ui.chatQuery = el.value;
    const list = $('#chat-list');
    if (list) {
      list.innerHTML = chatRowsHTML();
      hydrateMedia(list);
    }
    return;
  }

  if (el.id === 'add-id-input') {
    const clean = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (el.value !== clean) el.value = clean;
    const count = $('#add-id-count');
    if (count) count.textContent = `${clean.length}/8`;
    const button = $('#add-search-btn');
    if (button) button.disabled = clean.length !== 8;
    const result = $('#add-result');
    if (result) result.innerHTML = '';
  }
}

async function onChange(event) {
  const el = event.target;
  if (el.id === 'post-image-input') {
    const file = el.files?.[0];
    el.value = '';
    if (file) await preparePostImage(file);
    return;
  }
  if (el.id === 'avatar-file') {
    const file = el.files?.[0];
    el.value = '';
    if (file) await prepareAvatar(file);
    return;
  }
  if (el.id === 'video-file') {
    const file = el.files?.[0];
    if (file) prepareVideo(file);
  }
}

function onKeydown(event) {
  if (event.key !== 'Escape') return;
  if ($('.sheet-layer')) {
    closeSheet();
    return;
  }
  if (isGameOpen()) {
    closeGame();
    return;
  }
  if ($('.screen.chat-screen')) closeChatScreen();
}

/* --------------------------- Posts and media -------------------------- */

async function preparePostImage(file) {
  if (!file.type.startsWith('image/')) {
    toast('الملف المختار ليس صورة', 'error');
    return;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    toast('حجم الصورة كبير. الحد الأقصى ١٢ م.ب', 'error');
    return;
  }
  try {
    const blob = await compressImage(file, 1600, 0.86);
    if (ui.composerImage?.url) URL.revokeObjectURL(ui.composerImage.url);
    ui.composerImage = { blob, url: URL.createObjectURL(blob) };
    renderPosts();
  } catch {
    toast('تعذر قراءة الصورة', 'error');
  }
}

async function prepareAvatar(file) {
  if (!file.type.startsWith('image/')) {
    toast('الملف المختار ليس صورة', 'error');
    return;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    toast('حجم الصورة كبير. الحد الأقصى ١٢ م.ب', 'error');
    return;
  }
  try {
    const blob = await compressImage(file, 640, 0.9);
    if (ui.avatarDraft?.url) URL.revokeObjectURL(ui.avatarDraft.url);
    ui.avatarDraft = { blob, url: URL.createObjectURL(blob) };
    const preview = $('#edit-avatar-preview');
    if (preview) {
      preview.innerHTML = `<span class="avatar avatar-xl" style="--a:${state.me.colors[0]};--b:${state.me.colors[1]}"><img src="${ui.avatarDraft.url}" alt="" /></span>`;
    }
    toast('تم تجهيز الصورة الجديدة');
  } catch {
    toast('تعذر قراءة الصورة', 'error');
  }
}

function prepareVideo(file) {
  if (!file.type.startsWith('video/')) {
    toast('الملف المختار ليس فيديو', 'error');
    return;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    toast('حجم الفيديو كبير. الحد الأقصى ٨٠ م.ب', 'error');
    return;
  }
  if (ui.videoDraft?.url) URL.revokeObjectURL(ui.videoDraft.url);
  const url = URL.createObjectURL(file);
  ui.videoDraft = { file, url };
  const drop = $('#video-drop');
  if (drop) {
    drop.classList.add('is-ready');
    drop.innerHTML = `
      <input id="video-file" type="file" accept="video/*" hidden />
      <span class="upload-icon ready">${'<svg class="ic" aria-hidden="true"><use href="#i-check"></use></svg>'}</span>
      <b>${escapeHTML(file.name)}</b>
      <span>${fileSizeLabel(file.size)} · اضغط لتغيير الفيديو</span>`;
  }
  const preview = $('#video-preview');
  if (preview) {
    preview.innerHTML = `<video src="${url}" controls playsinline preload="metadata"></video>`;
  }
}

async function createPost(form) {
  const text = (form.querySelector('textarea[name="text"]')?.value || '').trim();
  const image = ui.composerImage;
  if (!text && !image) {
    toast('اكتب شيئاً أو أضف صورة قبل النشر', 'error');
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.innerHTML = 'جارٍ النشر...';
  }
  try {
    let imageKey = null;
    if (image) imageKey = await putMedia(image.blob);
    state.posts.unshift({
      id: uid('post'),
      authorId: 'me',
      text,
      image: null,
      imageKey,
      likes: 0,
      liked: false,
      saved: false,
      createdAt: Date.now(),
      comments: []
    });
    saveState();
    if (ui.composerImage?.url) URL.revokeObjectURL(ui.composerImage.url);
    ui.composerImage = null;
    ui.composerText = '';
    renderPosts();
    renderAccount();
    const view = $('.view[data-view="posts"]');
    if (view) view.scrollTop = 0;
    toast('تم نشر منشورك ✓');
  } catch {
    toast('تعذر نشر المنشور. حاول مرة أخرى', 'error');
    if (button) {
      button.disabled = false;
      button.innerHTML = `نشر ${'<svg class="ic" aria-hidden="true"><use href="#i-send"></use></svg>'}`;
    }
  }
}

function togglePostLike(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  post.liked = !post.liked;
  post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
  saveState();
  $$(`[data-action="like-post"][data-id="${id}"]`).forEach((button) => {
    button.classList.toggle('is-liked', post.liked);
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', post.liked ? '#i-heart-fill' : '#i-heart');
    const count = button.querySelector('span');
    if (count) count.textContent = String(post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1).replace('.0', '')} ألف` : post.likes);
    button.classList.remove('pop');
    void button.offsetWidth;
    button.classList.add('pop');
  });
}

function togglePostComments(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  const card = $(`.post[data-post-id="${id}"]`);
  if (!card) return;
  const section = card.querySelector('.post-comments');
  const button = card.querySelector('[data-action="toggle-comments"]');
  if (!section) return;
  const opening = section.hidden;
  if (opening && !section.dataset.ready) {
    section.innerHTML = postCommentsHTML(post);
    section.dataset.ready = '1';
    hydrateMedia(section);
  }
  section.hidden = !opening;
  if (button) button.setAttribute('aria-expanded', String(opening));
  if (opening) {
    ui.openComments.add(id);
    section.querySelector('input')?.focus({ preventScroll: true });
  } else {
    ui.openComments.delete(id);
  }
}

function addComment(form) {
  const id = form.dataset.id;
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  const input = form.querySelector('input[name="comment"]');
  const text = input?.value.trim();
  if (!text) return;
  post.comments.push({ id: uid('c'), userId: 'me', text, createdAt: Date.now() });
  saveState();
  const card = $(`.post[data-post-id="${id}"]`);
  const section = card?.querySelector('.post-comments');
  if (section) {
    section.innerHTML = postCommentsHTML(post);
    section.dataset.ready = '1';
    hydrateMedia(section);
  }
  const count = card?.querySelector('[data-action="toggle-comments"] span');
  if (count) count.textContent = String(post.comments.length);
  section?.querySelector('input')?.focus({ preventScroll: true });
}

function toggleSavedPost(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  post.saved = !post.saved;
  saveState();
  $$(`[data-action="save-post"][data-id="${id}"]`).forEach((button) => {
    button.classList.toggle('is-saved', post.saved);
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', post.saved ? '#i-bookmark-fill' : '#i-bookmark');
  });
  if (ui.profileTab === 'saved') renderAccount();
  toast(post.saved ? 'تمت الإضافة إلى المحفوظات' : 'أُزيل من المحفوظات');
}

function deletePost(id) {
  state.posts = state.posts.filter((item) => item.id !== id);
  ui.openComments.delete(id);
  saveState();
  closeSheet(true);
  renderPosts();
  renderAccount();
  toast('تم حذف المنشور');
}

/* ------------------------------ Video media --------------------------- */

async function uploadVideo(form) {
  const file = ui.videoDraft?.file;
  if (!file) {
    toast('اختر فيديو أولاً', 'error');
    return;
  }
  const caption = (form.querySelector('textarea[name="caption"]')?.value || '').trim();
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.innerHTML = 'جارٍ تجهيز الفيديو...';
  }
  try {
    const poster = await createVideoPoster(file);
    const mediaKey = await putMedia(file);
    const posterKey = poster.posterBlob ? await putMedia(poster.posterBlob) : null;
    const title = caption.split('\n')[0].slice(0, 46).trim() || 'ريل جديد';
    const video = {
      id: uid('vid'),
      authorId: 'me',
      title,
      caption: caption || 'لحظة جديدة على نبض ✨',
      demo: null,
      mediaKey,
      posterKey,
      duration: poster.duration || 0,
      music: `صوت أصلي — ${state.me.name}`,
      likes: 0,
      liked: false,
      createdAt: Date.now(),
      comments: []
    };
    state.videos.unshift(video);
    saveState();
    closeSheet(true);
    ui.videoDraft = null;
    renderReels();
    renderAccount();
    navigate('videos');
    ui.activeReelId = video.id;
    requestAnimationFrame(() => {
      const article = document.getElementById(`reel-${video.id}`);
      if (article) article.scrollIntoView({ block: 'start' });
      activateReel(video.id);
    });
    toast('تم نشر الفيديو ✓');
  } catch {
    toast('تعذر تجهيز الفيديو. جرّب ملفاً آخر', 'error');
    if (button) {
      button.disabled = false;
      button.innerHTML = 'نشر الفيديو';
    }
  }
}

function addVideoComment(form) {
  const id = form.dataset.id;
  const video = state.videos.find((item) => item.id === id);
  if (!video) return;
  const input = form.querySelector('input[name="comment"]');
  const text = input?.value.trim();
  if (!text) return;
  video.comments.push({ id: uid('vc'), userId: 'me', text, createdAt: Date.now() });
  saveState();
  refreshVideoComments(id);
  if (input) input.value = '';
}

function deleteVideo(id) {
  const index = state.videos.findIndex((item) => item.id === id);
  if (index < 0) return;
  state.videos = state.videos.filter((item) => item.id !== id);
  if (ui.activeReelId === id) {
    ui.activeReelId = state.videos[Math.min(index, state.videos.length - 1)]?.id || null;
  }
  saveState();
  closeSheet(true);
  renderReels();
  renderAccount();
  navigate('videos');
  toast('تم حذف الفيديو');
}

/* ------------------------------- Profile ------------------------------ */

async function saveProfile(form) {
  const name = (form.querySelector('input[name="name"]')?.value || '').trim();
  const bio = (form.querySelector('textarea[name="bio"]')?.value || '').trim();
  if (!name) {
    toast('الاسم لا يمكن أن يكون فارغاً', 'error');
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.innerHTML = 'جارٍ الحفظ...';
  }
  try {
    state.me.name = name;
    state.me.initial = Array.from(name)[0] || 'ن';
    state.me.bio = bio;
    if (ui.avatarDraft?.blob) {
      const key = await putMedia(ui.avatarDraft.blob);
      state.me.avatar = key;
    }
    saveState();
    closeSheet(true);
    renderAccount();
    renderPosts();
    renderReels();
    toast('تم حفظ التعديلات ✓');
  } catch {
    toast('تعذر حفظ التعديلات', 'error');
    if (button) button.disabled = false;
  }
}
