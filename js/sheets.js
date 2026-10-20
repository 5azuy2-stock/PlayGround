import { NOTIFICATIONS, SUGGESTED_IDS, PEOPLE } from './data.js';
import {
  state,
  ui,
  $,
  $$,
  icon,
  escapeHTML,
  formatCount,
  timeAgo,
  personById,
  isFollowing,
  isFriend,
  avatarHTML,
  verifiedBadge,
  saveState,
  toast,
  copyText
} from './core.js';
import { hydrateMedia } from './media.js';
import { renderAccount, renderPosts, navigate } from './views.js';
import { pauseReels, resumeReels } from './reels.js';
import { messageUser, ensureChat } from './chat.js';

/* ------------------------------ Base sheet ---------------------------- */

export function openSheet(html, options = {}) {
  closeSheet(true);
  const root = $('#overlay-root');
  if (!root) return null;
  pauseReels();
  const layer = document.createElement('div');
  layer.className = 'sheet-layer';
  layer.innerHTML = `
    <div class="sheet-backdrop" data-action="backdrop"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHTML(options.label || 'نافذة')}">
      <div class="sheet-handle" aria-hidden="true"></div>
      ${html}
    </div>`;
  root.appendChild(layer);
  requestAnimationFrame(() => layer.classList.add('is-open'));
  hydrateMedia(layer);
  if (options.focus) {
    setTimeout(() => {
      const field = $(options.focus, layer);
      if (field) {
        field.focus();
        if (field.setSelectionRange && field.value) field.setSelectionRange(field.value.length, field.value.length);
      }
    }, 260);
  }
  return layer;
}

export function closeSheet(immediate = false) {
  const layer = $('.sheet-layer');
  if (!layer) {
    if (!immediate) resumeReels();
    return;
  }
  if (ui.videoDraft?.url) {
    URL.revokeObjectURL(ui.videoDraft.url);
    ui.videoDraft = null;
  }
  if (ui.avatarDraft?.url) {
    URL.revokeObjectURL(ui.avatarDraft.url);
    ui.avatarDraft = null;
  }
  layer.classList.remove('is-open');
  if (immediate) layer.remove();
  else setTimeout(() => layer.remove(), 240);
  if (!immediate) resumeReels();
}

export function sheetHead(title, subtitle = '') {
  return `
    <div class="sheet-head">
      <div>
        <h2>${escapeHTML(title)}</h2>
        ${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}
      </div>
      <button class="icon-btn round" type="button" data-action="close-sheet" aria-label="إغلاق">
        ${icon('i-close')}
      </button>
    </div>`;
}

/* ------------------------------- Relations ---------------------------- */

export function followButtonHTML(id, extra = 'btn-sm') {
  const following = isFollowing(id);
  return `<button class="btn ${following ? 'btn-soft' : 'btn-primary'} ${extra}" type="button" data-action="toggle-follow" data-id="${id}">${following ? 'متابع' : 'متابعة'}</button>`;
}

export function friendButtonHTML(id, extra = 'btn-sm') {
  const friend = isFriend(id);
  return `<button class="btn ${friend ? 'btn-soft' : 'btn-outline'} ${extra}" type="button" data-action="toggle-friend" data-id="${id}">${friend ? 'صديق' : 'إضافة صديق'}</button>`;
}

export function syncRelationButtons() {
  $$('[data-action="toggle-follow"][data-id]').forEach((button) => {
    const following = isFollowing(button.dataset.id);
    button.textContent = following ? 'متابع' : 'متابعة';
    button.classList.toggle('btn-primary', !following);
    button.classList.toggle('btn-soft', following);
  });
  $$('[data-action="toggle-friend"][data-id]').forEach((button) => {
    const friend = isFriend(button.dataset.id);
    button.textContent = friend ? 'صديق' : 'إضافة صديق';
    button.classList.toggle('btn-outline', !friend);
    button.classList.toggle('btn-soft', friend);
  });
}

export function toggleFollow(id) {
  const person = personById(id);
  if (!person || person.isMe) return;
  const index = state.relations.following.indexOf(id);
  if (index >= 0) {
    state.relations.following.splice(index, 1);
    state.stats.following = Math.max(0, state.stats.following - 1);
    toast(`ألغيت متابعة ${person.name}`);
  } else {
    state.relations.following.push(id);
    state.stats.following += 1;
    toast(`تابعت ${person.name}`);
  }
  saveState();
  syncRelationButtons();
  $$(`.reel-author[data-id="${id}"] .reel-follow-chip`).forEach((chip) => {
    chip.textContent = isFollowing(id) ? 'متابع' : 'متابعة';
  });
  renderAccount();
  if (ui.feedFilter === 'following') renderPosts();
}

export function toggleFriend(id) {
  const person = personById(id);
  if (!person || person.isMe) return;
  const index = state.relations.friends.indexOf(id);
  if (index >= 0) {
    state.relations.friends.splice(index, 1);
    state.stats.friends = Math.max(0, state.stats.friends - 1);
    toast(`أزلت ${person.name} من الأصدقاء`);
  } else {
    state.relations.friends.push(id);
    state.stats.friends += 1;
    toast(`أضفت ${person.name} إلى أصدقائك`);
  }
  saveState();
  syncRelationButtons();
  renderAccount();
  if (ui.feedFilter === 'friends') renderPosts();
}

/* ------------------------------- Add by ID ---------------------------- */

export function openAddSheet(prefill = '') {
  const safePrefill = String(prefill).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const layer = openSheet(`
    ${sheetHead('إضافة عبر المعرّف', 'ابحث عن شخص بهويته المكوّنة من ٨ أحرف أو أرقام.')}
    <form data-form="find-id" class="add-form">
      <label class="field">
        <span>معرّف الشخص</span>
        <span class="id-input-shell">
          <input id="add-id-input" class="id-input" dir="ltr" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="8" placeholder="A1B2C3D4" value="${escapeHTML(safePrefill)}" aria-label="معرّف الشخص" />
          <em id="add-id-count">${safePrefill.length}/8</em>
        </span>
      </label>
      <p class="field-hint">أحرف إنجليزية كبيرة وأرقام فقط، بدون مسافات.</p>
      <button class="btn btn-primary btn-wide" type="submit" id="add-search-btn" ${safePrefill.length === 8 ? '' : 'disabled'}>
        ${icon('i-search')} بحث
      </button>
    </form>
    <div id="add-result" class="add-result"></div>
    <div class="suggested-block">
      <div class="sheet-subhead"><span>جرّب أحد هذه المعرّفات</span></div>
      <div class="suggested-chips">
        ${SUGGESTED_IDS.map((id) => {
          const person = personById(id);
          return `<button class="suggested-chip" type="button" data-action="fill-id" data-id="${id}">
            ${avatarHTML(person, 'avatar-xxs')}
            <span><b>${escapeHTML(person?.name || id)}</b><em dir="ltr">${id}</em></span>
          </button>`;
        }).join('')}
      </div>
    </div>
  `, { label: 'إضافة عبر المعرّف', focus: '#add-id-input' });

  if (safePrefill.length === 8) {
    setTimeout(() => renderLookupResult(safePrefill), 320);
  }
  return layer;
}

export function renderLookupResult(code) {
  const result = $('#add-result');
  if (!result) return;
  ui.lookupId = code;
  const person = findPerson(code);

  if (!person) {
    result.innerHTML = `
      <div class="lookup-empty">
        <span class="lookup-icon">${icon('i-search')}</span>
        <b>لا يوجد حساب بهذا المعرّف</b>
        <p>تأكد أن المعرّف مكوّن من ٨ أحرف إنجليزية أو أرقام. جرّب البحث مرة أخرى.</p>
        <button class="btn btn-soft btn-sm" type="button" data-action="fill-id" data-id="R3EM2026">جرّب R3EM2026</button>
      </div>`;
    hydrateMedia(result);
    return;
  }

  if (person.isMe) {
    result.innerHTML = `
      <div class="lookup-card is-me">
        ${avatarHTML(person, 'avatar-lg')}
        <div class="lookup-info">
          <div class="lookup-name">${escapeHTML(person.name)}${verifiedBadge(person)}</div>
          <p>هذا معرّفك. شاركه مع أصدقائك ليضيفوك.</p>
          <button class="id-pill compact" type="button" data-action="copy-id">
            <span class="id-label">المعرّف</span>
            <span class="id-code" dir="ltr">${escapeHTML(person.id)}</span>
            ${icon('i-copy')}
          </button>
        </div>
      </div>`;
    hydrateMedia(result);
    return;
  }

  result.innerHTML = `
    <div class="lookup-card">
      <div class="lookup-head">
        ${avatarHTML(person, 'avatar-lg')}
        <div class="lookup-info">
          <div class="lookup-name">${escapeHTML(person.name)}${verifiedBadge(person)}</div>
          <span class="lookup-tag">${escapeHTML(person.tag || 'على نبض')} · @${escapeHTML(person.handle || 'nabd')}</span>
          <button class="id-pill compact" type="button" data-action="copy-id" data-id="${person.id}">
            <span class="id-label">المعرّف</span>
            <span class="id-code" dir="ltr">${escapeHTML(person.id)}</span>
            ${icon('i-copy')}
          </button>
        </div>
      </div>
      <p class="lookup-bio">${escapeHTML(person.bio || '')}</p>
      <div class="lookup-actions">
        ${followButtonHTML(person.id)}
        ${friendButtonHTML(person.id)}
        <button class="btn btn-outline btn-sm" type="button" data-action="message-person" data-id="${person.id}">
          ${icon('i-chat')} مراسلة
        </button>
      </div>
    </div>`;
  hydrateMedia(result);
}

function findPerson(code) {
  if (code === state.me.id) return personById('me');
  return PEOPLE.find((item) => item.id === code) || null;
}

/* ------------------------------- Person ------------------------------- */

export function openPersonSheet(id) {
  const person = personById(id);
  if (!person) return;
  const isMe = Boolean(person.isMe);
  const actionSection = isMe
    ? `<div class="lookup-actions">
         <button class="btn btn-primary btn-sm" type="button" data-action="edit-profile">${icon('i-settings')} تعديل الملف</button>
         <button class="btn btn-outline btn-sm" type="button" data-action="copy-id">${icon('i-copy')} نسخ المعرّف</button>
       </div>`
    : `<div class="lookup-actions">
         ${followButtonHTML(person.id)}
         ${friendButtonHTML(person.id)}
         <button class="btn btn-outline btn-sm" type="button" data-action="message-person" data-id="${person.id}">
           ${icon('i-chat')} مراسلة
         </button>
       </div>`;

  openSheet(`
    ${sheetHead('الملف الشخصي', isMe ? 'هكذا يراك الآخرون على نبض.' : 'تعرّف على هذا الشخص قبل أن تتابعه.')}
    <div class="person-sheet-card">
      <div class="person-sheet-cover" aria-hidden="true"></div>
      <div class="person-sheet-body">
        ${avatarHTML(person, 'avatar-xl', { online: person.online })}
        <div class="lookup-name">${escapeHTML(person.name)}${verifiedBadge(person)}</div>
        <span class="lookup-tag">${escapeHTML(person.tag || 'على نبض')} · @${escapeHTML(person.handle || 'nabd')}</span>
        <button class="id-pill compact" type="button" data-action="copy-id" ${isMe ? '' : `data-id="${person.id}"`}>
          <span class="id-label">المعرّف</span>
          <span class="id-code" dir="ltr">${escapeHTML(person.id)}</span>
          ${icon('i-copy')}
        </button>
        <p class="lookup-bio">${escapeHTML(person.bio || '')}</p>
        <div class="person-mini-stats">
          <div><b>${formatCount(isMe ? state.stats.followers : 400 + person.id.charCodeAt(0) * 7)}</b><span>متابع</span></div>
          <div><b>${formatCount(isMe ? state.stats.following : 80 + person.id.charCodeAt(1) * 3)}</b><span>يتابع</span></div>
          <div><b>${formatCount(isMe ? state.stats.friends : 12 + person.id.charCodeAt(2) % 40)}</b><span>صديق</span></div>
        </div>
        ${actionSection}
      </div>
    </div>
  `, { label: 'الملف الشخصي' });
}

/* -------------------------------- Stats ------------------------------- */

export function openStatsSheet(type) {
  const meta = {
    followers: { label: 'المتابعون', empty: 'لا يوجد متابعون بعد.' },
    following: { label: 'متابعيني', empty: 'لا تتابع أحداً بعد.' },
    friends: { label: 'الأصدقاء', empty: 'لا يوجد أصدقاء بعد. أضف صديقاً بمعرّفه.' }
  }[type] || { label: 'الأشخاص', empty: 'لا يوجد أحد هنا.' };
  const ids = [...(state.relations[type] || [])];
  const people = ids.map((id) => personById(id)).filter(Boolean);
  const total = type === 'followers' ? state.stats.followers : type === 'following' ? state.stats.following : state.stats.friends;
  const remaining = Math.max(0, total - people.length);

  openSheet(`
    ${sheetHead(meta.label, 'أبرز الحسابات في هذه القائمة.')}
    <div class="people-list">
      ${people.length ? people.map((person) => `
        <button class="person-row" type="button" data-action="open-person" data-id="${person.id}">
          ${avatarHTML(person, 'avatar', { online: person.online })}
          <span class="person-row-info">
            <b>${escapeHTML(person.name)}${verifiedBadge(person)}</b>
            <span>${escapeHTML(person.tag || 'على نبض')} · <em dir="ltr">${person.id}</em></span>
          </span>
          <span class="person-row-action">${icon('i-back')}</span>
        </button>`).join('') : `<div class="empty-state compact"><span class="empty-icon">${icon('i-user')}</span><b>${meta.empty}</b></div>`}
    </div>
    ${remaining ? `<p class="list-footnote">و ${formatCount(remaining)} شخصاً آخر خارج هذه القائمة.</p>` : ''}
    <button class="btn btn-primary btn-wide" type="button" data-action="open-add">
      ${icon('i-add-user')} إضافة عبر المعرّف
    </button>
  `, { label: meta.label });
}

/* ----------------------------- Notifications -------------------------- */

export function openNotificationsSheet() {
  if (!state.notificationsRead) {
    state.notificationsRead = true;
    saveState();
  }
  const dot = $('#notif-dot');
  if (dot) dot.hidden = true;
  const typeMeta = {
    like: { icon: 'i-heart-fill', cls: 'like' },
    follow: { icon: 'i-add-user', cls: 'follow' },
    comment: { icon: 'i-comment', cls: 'comment' },
    friend: { icon: 'i-user', cls: 'friend' }
  };

  openSheet(`
    ${sheetHead('الإشعارات', 'آخر ما حدث على حسابك.')}
    <div class="notif-list">
      ${NOTIFICATIONS.map((notification) => {
        const person = personById(notification.userId);
        const meta = typeMeta[notification.type] || typeMeta.like;
        return `<button class="notif-row" type="button" data-action="open-person" data-id="${notification.userId}">
          <span class="notif-icon ${meta.cls}">${icon(meta.icon)}</span>
          ${avatarHTML(person, 'avatar-sm')}
          <span class="notif-copy">
            <b>${escapeHTML(person?.name || 'مستخدم نبض')}</b>
            <span>${escapeHTML(notification.text)}</span>
            <em>${timeAgo(Date.now() - notification.at * 60000)}</em>
          </span>
        </button>`;
      }).join('')}
    </div>
  `, { label: 'الإشعارات' });
}

/* ------------------------------ Edit profile -------------------------- */

export function openEditProfileSheet() {
  ui.avatarDraft = null;
  const me = state.me;
  openSheet(`
    ${sheetHead('تعديل الملف', 'حدّث صورتك ونبذتك كما تحب.')}
    <form data-form="edit-profile" class="edit-form">
      <div class="avatar-editor">
        <span id="edit-avatar-preview">${avatarHTML(me, 'avatar-xl')}</span>
        <label class="btn btn-outline btn-sm avatar-upload" for="avatar-file">
          ${icon('i-camera')} تغيير الصورة
        </label>
        <input id="avatar-file" type="file" accept="image/*" hidden />
      </div>
      <label class="field">
        <span>الاسم</span>
        <input name="name" type="text" maxlength="24" value="${escapeHTML(me.name)}" required />
      </label>
      <label class="field">
        <span>النبذة</span>
        <textarea name="bio" maxlength="120" rows="3">${escapeHTML(me.bio)}</textarea>
      </label>
      <label class="field">
        <span>معرّفك (ثابت)</span>
        <span class="id-input-shell readonly">
          <input class="id-input" dir="ltr" value="${escapeHTML(me.id)}" readonly aria-label="معرّفك" />
          <button class="copy-inline" type="button" data-action="copy-id" aria-label="نسخ المعرّف">${icon('i-copy')}</button>
        </span>
      </label>
      <p class="field-hint">${icon('i-lock')} لا يمكن تغيير المعرّف. صورتك تُحفظ على جهازك فقط.</p>
      <button class="btn btn-primary btn-wide" type="submit">${icon('i-check')} حفظ التغييرات</button>
    </form>
  `, { label: 'تعديل الملف' });
}

/* ------------------------------ Video upload -------------------------- */

export function openVideoUploadSheet() {
  openSheet(`
    ${sheetHead('رفع فيديو', 'شارك لحظتك في قسم الفيديوهات.')}
    <form data-form="upload-video" class="upload-form">
      <label class="upload-drop" for="video-file" id="video-drop">
        <input id="video-file" type="file" accept="video/*" hidden />
        <span class="upload-icon">${icon('i-upload')}</span>
        <b>اختر فيديو من جهازك</b>
        <span>MP4 أو WebM · حتى ٨٠ م.ب</span>
      </label>
      <div id="video-preview" class="video-preview"></div>
      <label class="field">
        <span>الوصف</span>
        <textarea name="caption" maxlength="200" rows="3" placeholder="اكتب وصفاً قصيراً للفيديو..."></textarea>
      </label>
      <button class="btn btn-primary btn-wide" type="submit" id="video-submit">${icon('i-upload')} نشر الفيديو</button>
      <p class="field-hint">${icon('i-lock')} يبقى الفيديو محفوظاً على جهازك ولا يُرفع إلى أي خادم.</p>
    </form>
  `, { label: 'رفع فيديو' });
}

export function openVideoCommentsSheet(videoId) {
  const video = state.videos.find((item) => item.id === videoId);
  if (!video) return;
  openSheet(`
    ${sheetHead('التعليقات', `${video.comments.length} تعليق على هذا الفيديو`)}
    <div class="comment-sheet-preview">
      ${video.posterKey ? `<img data-media="${escapeHTML(video.posterKey)}" alt="" />` : `<span class="demo-poster demo-${escapeHTML(video.demo || 'generic')}"></span>`}
      <span><b>${escapeHTML(video.title || 'ريل')}</b><em>${escapeHTML(video.caption || '')}</em></span>
    </div>
    <div class="comment-list sheet-comments" id="video-comment-list">${videoCommentRowsHTML(video)}</div>
    <form class="comment-form" data-form="add-video-comment" data-id="${video.id}">
      ${avatarHTML(state.me, 'avatar-xs')}
      <input name="comment" type="text" maxlength="180" placeholder="أضف تعليقاً..." aria-label="تعليق" autocomplete="off" />
      <button type="submit" aria-label="إرسال التعليق">${icon('i-send')}</button>
    </form>
  `, { label: 'التعليقات' });
}

export function videoCommentRowsHTML(video) {
  if (!video.comments.length) return '<p class="comment-empty">لا توجد تعليقات بعد. كن أول من يعلّق.</p>';
  return video.comments.map((comment) => {
    const person = comment.userId === 'me' ? personById('me') : personById(comment.userId);
    return `
      <div class="comment-row">
        ${avatarHTML(person, 'avatar-xs')}
        <div class="comment-body">
          <div class="comment-name">${escapeHTML(person?.name || 'مستخدم نبض')}<span>${timeAgo(comment.createdAt)}</span></div>
          <p>${escapeHTML(comment.text)}</p>
        </div>
      </div>`;
  }).join('');
}

export function refreshVideoComments(videoId) {
  const video = state.videos.find((item) => item.id === videoId);
  if (!video) return;
  const list = $('#video-comment-list');
  if (list) {
    list.innerHTML = videoCommentRowsHTML(video);
    hydrateMedia(list);
  }
  $$(`[data-action="video-comments"][data-id="${videoId}"] span`).forEach((span) => {
    span.textContent = String(video.comments.length);
  });
}

/* ------------------------------ Confirm sheets ------------------------ */

export function openPostOptions(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;
  openSheet(`
    ${sheetHead('خيارات المنشور', 'يمكنك حذف منشورك أو نسخه.')}
    <button class="sheet-option" type="button" data-action="copy-post" data-id="${postId}">
      <span class="sheet-option-icon">${icon('i-copy')}</span>
      <span><b>نسخ نص المنشور</b><em>شاركه في مكان آخر</em></span>
    </button>
    <button class="sheet-option danger" type="button" data-action="confirm-delete-post" data-id="${postId}">
      <span class="sheet-option-icon">${icon('i-trash')}</span>
      <span><b>حذف المنشور</b><em>لا يمكن التراجع عن هذا الإجراء</em></span>
    </button>
    <button class="btn btn-soft btn-wide" type="button" data-action="close-sheet">إلغاء</button>
  `, { label: 'خيارات المنشور' });
}

export function openDeleteVideoSheet(videoId) {
  const video = state.videos.find((item) => item.id === videoId);
  if (!video) return;
  openSheet(`
    ${sheetHead('حذف الفيديو', 'هل تريد حذف هذا الفيديو نهائياً؟')}
    <div class="delete-preview">
      ${video.posterKey ? `<img data-media="${escapeHTML(video.posterKey)}" alt="" />` : `<span class="demo-poster demo-${escapeHTML(video.demo || 'generic')}"></span>`}
      <div><b>${escapeHTML(video.title || 'ريل')}</b><span>${formatCount(video.likes)} إعجاب · ${video.comments.length} تعليق</span></div>
    </div>
    <div class="confirm-actions">
      <button class="btn btn-danger" type="button" data-action="confirm-delete-video" data-id="${video.id}">${icon('i-trash')} حذف نهائي</button>
      <button class="btn btn-soft" type="button" data-action="close-sheet">إلغاء</button>
    </div>
  `, { label: 'حذف الفيديو' });
}

/* ------------------------------- New chat ----------------------------- */

export function openNewChatSheet() {
  openSheet(`
    ${sheetHead('محادثة جديدة', 'اختر شخصاً لبدء الدردشة.')}
    <div class="people-list">
      ${PEOPLE.map((person) => `
        <button class="person-row" type="button" data-action="message-person" data-id="${person.id}">
          ${avatarHTML(person, 'avatar', { online: person.online })}
          <span class="person-row-info">
            <b>${escapeHTML(person.name)}${verifiedBadge(person)}</b>
            <span>${escapeHTML(person.tag || 'على نبض')}${person.online ? ' · متصل الآن' : ''}</span>
          </span>
          <span class="person-row-action chat">${icon('i-chat')}</span>
        </button>`).join('')}
    </div>
  `, { label: 'محادثة جديدة' });
}

/* ------------------------------ Misc helpers -------------------------- */

export async function copyIdAction(id) {
  const person = id ? personById(id) : personById('me');
  if (!person) return;
  const ok = await copyText(person.id);
  toast(ok ? 'تم نسخ المعرّف' : 'تعذر النسخ', ok ? 'ok' : 'error');
}
