import {
  state,
  ui,
  $,
  $$,
  icon,
  escapeHTML,
  clip,
  linkify,
  formatCount,
  timeAgo,
  personById,
  postAuthor,
  postImageHTML,
  videoPosterHTML,
  avatarHTML,
  verifiedBadge,
  updateBadges,
  feedPosts,
  saveState,
  toast,
  MAX_POST_CHARS
} from './core.js';
import { hydrateMedia } from './media.js';
import { renderReels, activateReel, stopReels } from './reels.js';
import { gamesViewHTML } from './games.js';

export function renderAll() {
  renderAccount();
  renderMessages();
  renderReels();
  renderPosts();
  renderGames();
  updateBadges();
  hydrateMedia(document);
  const view = $(`.view[data-view="${ui.tab}"]`);
  if (view) view.scrollTop = 0;
  if (ui.tab === 'videos') {
    const id = ui.activeReelId || state.videos[0]?.id;
    requestAnimationFrame(() => {
      if (id) activateReel(id);
    });
  }
}

export function navigate(tab) {
  if (!tab) return;
  const changed = ui.tab !== tab;
  ui.tab = tab;
  $$('.view').forEach((view) => {
    view.classList.toggle('is-active', view.dataset.view === tab);
  });
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.tab === tab);
  });
  if (tab === 'account') renderAccount();
  else if (tab === 'posts') renderPosts();
  else if (tab === 'messages') renderMessages();
  else if (tab === 'games') renderGames();
  updateBadges();
  const view = $(`.view[data-view="${tab}"]`);
  if (view && changed) view.scrollTop = 0;
  if (tab === 'videos') {
    const wanted = ui.pendingReelFocus || ui.activeReelId;
    const id = state.videos.some((video) => video.id === wanted) ? wanted : state.videos[0]?.id;
    ui.pendingReelFocus = null;
    requestAnimationFrame(() => {
      if (id) activateReel(id);
    });
  } else {
    stopReels();
  }
}

export function focusPost(id) {
  navigate('posts');
  requestAnimationFrame(() => {
    let card = $(`.post[data-post-id="${id}"]`);
    if (!card) {
      ui.feedFilter = 'all';
      renderPosts();
      card = $(`.post[data-post-id="${id}"]`);
    }
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('is-flash');
    setTimeout(() => card.classList.remove('is-flash'), 1600);
  });
}

export function focusVideo(id) {
  ui.pendingReelFocus = id;
  navigate('videos');
}

/* ------------------------------- Account ------------------------------ */

export function renderAccount() {
  const view = $('.view[data-view="account"]');
  if (!view) return;
  const me = state.me;
  const myPosts = state.posts.filter((post) => post.authorId === 'me').sort((a, b) => b.createdAt - a.createdAt);
  const myVideos = state.videos.filter((video) => video.authorId === 'me').sort((a, b) => b.createdAt - a.createdAt);
  const savedPosts = state.posts.filter((post) => post.saved).sort((a, b) => b.createdAt - a.createdAt);
  const activeList = ui.profileTab === 'posts' ? myPosts : ui.profileTab === 'videos' ? myVideos : savedPosts;
  const tabs = [
    { key: 'posts', label: 'منشوراتي', count: myPosts.length },
    { key: 'videos', label: 'فيديوهاتي', count: myVideos.length },
    { key: 'saved', label: 'المحفوظات', count: savedPosts.length }
  ];

  let grid = '';
  if (!activeList.length) {
    const copy = ui.profileTab === 'saved'
      ? ['لا توجد محفوظات', 'احفظ المنشورات التي تعجبك لتجدها هنا.']
      : ui.profileTab === 'videos'
        ? ['لا توجد فيديوهات', 'ارفع أول فيديو وشاركه مع متابعيك.']
        : ['لا توجد منشورات', 'انشر أول منشور لك وابدأ الحكاية.'];
    grid = `
      <div class="empty-state grid-empty">
        <span class="empty-icon">${icon(ui.profileTab === 'videos' ? 'i-reels' : ui.profileTab === 'saved' ? 'i-bookmark' : 'i-camera')}</span>
        <b>${copy[0]}</b>
        <p>${copy[1]}</p>
        <button class="btn btn-primary btn-sm" type="button" data-action="${ui.profileTab === 'videos' ? 'open-video-upload' : 'nav'}" ${ui.profileTab === 'videos' ? '' : 'data-tab="posts"'}>
          ${ui.profileTab === 'videos' ? 'رفع فيديو' : 'إلى المنشورات'}
        </button>
      </div>`;
  } else if (ui.profileTab === 'videos') {
    grid = activeList.map((video) => `
      <button class="grid-tile" type="button" data-action="focus-video" data-id="${video.id}" aria-label="${escapeHTML(video.title || 'فيديو')}">
        ${videoPosterHTML(video)}
        <span class="grid-play">${icon('i-play')}</span>
        <span class="grid-overlay">
          <span>${icon('i-heart-fill')} ${formatCount(video.likes)}</span>
          <span>${icon('i-comment')} ${video.comments.length}</span>
        </span>
      </button>`).join('');
  } else {
    grid = activeList.map((post) => profilePostTile(post)).join('');
  }

  view.innerHTML = `
    <div class="profile-card">
      <div class="profile-cover" aria-hidden="true">
        <span class="cover-blob one"></span>
        <span class="cover-blob two"></span>
        <span class="cover-grid"></span>
      </div>
      <div class="profile-body">
        <div class="profile-top">
          ${avatarHTML(me, 'avatar-xl')}
          <div class="profile-top-actions">
            <button class="icon-btn round" type="button" data-action="share-profile" aria-label="مشاركة الملف" title="مشاركة الملف">
              ${icon('i-share')}
            </button>
            <button class="btn btn-ghost btn-sm" type="button" data-action="edit-profile">
              ${icon('i-settings')} تعديل
            </button>
          </div>
        </div>
        <div class="profile-name-row">
          <h1>${escapeHTML(me.name)}</h1>
          ${verifiedBadge(me)}
        </div>
        <button class="id-pill" type="button" data-action="copy-id" title="نسخ المعرّف">
          <span class="id-label">المعرّف</span>
          <span class="id-code" dir="ltr">${escapeHTML(me.id)}</span>
          ${icon('i-copy')}
        </button>
        <p class="profile-bio">${escapeHTML(me.bio)}</p>
        <div class="profile-status"><i></i> نشط الآن</div>
      </div>
    </div>

    <div class="stats-card" role="group" aria-label="إحصاءات الحساب">
      <button class="stat" type="button" data-action="open-stats" data-stat="followers">
        <b>${formatCount(state.stats.followers)}</b>
        <span>المتابعون</span>
      </button>
      <button class="stat" type="button" data-action="open-stats" data-stat="following">
        <b>${formatCount(state.stats.following)}</b>
        <span>متابعيني</span>
      </button>
      <button class="stat" type="button" data-action="open-stats" data-stat="friends">
        <b>${formatCount(state.stats.friends)}</b>
        <span>الأصدقاء</span>
      </button>
    </div>

    <div class="add-friend-card">
      <span class="add-friend-icon">${icon('i-add-user')}</span>
      <div class="add-friend-copy">
        <b>أضف صديقاً بمعرّفه</b>
        <p>كل معرف يتكوّن من ٨ أحرف إنجليزية أو أرقام.</p>
      </div>
      <button class="btn btn-primary btn-sm" type="button" data-action="open-add">إضافة</button>
    </div>

    <div class="profile-tabs" role="tablist" aria-label="محتوى الحساب">
      ${tabs.map((tab) => `
        <button class="profile-tab ${ui.profileTab === tab.key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.profileTab === tab.key}" data-action="profile-tab" data-tab="${tab.key}">
          ${tab.label}<em>${tab.count}</em>
        </button>`).join('')}
    </div>

    <div class="profile-grid">${grid}</div>
    <p class="profile-footnote">${icon('i-lock')} بياناتك محفوظة على جهازك فقط.</p>
  `;
  hydrateMedia(view);
}

function profilePostTile(post) {
  const hasMedia = Boolean(post.image || post.imageKey);
  return `
    <button class="grid-tile ${hasMedia ? '' : 'is-text'}" type="button" data-action="focus-post" data-id="${post.id}" aria-label="عرض المنشور">
      ${hasMedia ? postImageHTML(post) : `<span class="grid-text">${escapeHTML(clip(post.text, 90))}</span>`}
      <span class="grid-overlay">
        <span>${icon('i-heart-fill')} ${formatCount(post.likes)}</span>
        <span>${icon('i-comment')} ${post.comments.length}</span>
      </span>
    </button>`;
}

/* -------------------------------- Posts ------------------------------- */

export function renderPosts() {
  const view = $('.view[data-view="posts"]');
  if (!view) return;
  const filtered = feedPosts();
  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'following', label: 'أتابع' },
    { key: 'friends', label: 'الأصدقاء' }
  ];
  const imagePreview = ui.composerImage
    ? `<div class="composer-preview" id="composer-preview">
         <img src="${ui.composerImage.url}" alt="معاينة الصورة" />
         <button class="preview-remove" type="button" data-action="remove-post-image" aria-label="إزالة الصورة">${icon('i-close')}</button>
       </div>`
    : '';

  view.innerHTML = `
    <div class="view-head posts-head">
      <div>
        <span class="eyebrow">${icon('i-pulse')} مجتمع نبض</span>
        <h1>المنشورات</h1>
        <p class="view-sub">أفكارك ولحظاتك... بين من يهمّهم الأمر.</p>
      </div>
      <button class="icon-btn round" type="button" data-action="open-add" aria-label="إضافة صديق">
        ${icon('i-add-user')}
      </button>
    </div>

    <form class="composer" data-form="create-post">
      <div class="composer-main">
        ${avatarHTML(state.me, 'avatar')}
        <textarea id="post-text" name="text" rows="2" maxlength="${MAX_POST_CHARS}" placeholder="بماذا تفكر؟ شارك لحظتك..." aria-label="نص المنشور">${escapeHTML(ui.composerText)}</textarea>
      </div>
      ${imagePreview}
      <div class="composer-bar">
        <div class="composer-tools">
          <button class="tool-btn" type="button" data-action="attach-post-image" title="إضافة صورة" aria-label="إضافة صورة">
            ${icon('i-image')}
          </button>
          <button class="tool-btn" type="button" data-action="attach-post-image" title="التقاط صورة" aria-label="التقاط صورة">
            ${icon('i-camera')}
          </button>
          <span class="char-counter" id="post-counter">${ui.composerText.length}/${MAX_POST_CHARS}</span>
        </div>
        <button class="btn btn-primary btn-sm composer-submit" type="submit">نشر ${icon('i-send')}</button>
      </div>
      <input type="file" id="post-image-input" accept="image/*" hidden />
    </form>

    <div class="feed-filters" role="tablist" aria-label="تصفية المنشورات">
      ${filters.map((filter) => `
        <button class="chip ${ui.feedFilter === filter.key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.feedFilter === filter.key}" data-action="filter-feed" data-filter="${filter.key}">
          ${filter.label}
        </button>`).join('')}
      <span class="feed-count">${filtered.length} منشور</span>
    </div>

    <div class="posts-list">
      ${filtered.length ? filtered.map(postCardHTML).join('') : emptyFeedHTML()}
    </div>
  `;
  hydrateMedia(view);
  const textarea = $('#post-text', view);
  if (textarea) autosize(textarea);
}

function emptyFeedHTML() {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon('i-sparkle')}</span>
      <b>لا توجد منشورات هنا بعد</b>
      <p>ابدأ بمتابعة أصدقائك أو انشر أول منشور لك.</p>
      <button class="btn btn-primary btn-sm" type="button" data-action="filter-feed" data-filter="all">عرض الكل</button>
    </div>`;
}

export function postCardHTML(post) {
  const author = postAuthor(post);
  const isOpen = ui.openComments.has(post.id);
  const media = postImageHTML(post, 'post-image');
  return `
    <article class="post" data-post-id="${post.id}">
      <header class="post-head">
        ${avatarHTML(author, 'avatar', { online: author.online })}
        <div class="post-author">
          <div class="post-name">${escapeHTML(author.name)}${verifiedBadge(author)}</div>
          <div class="post-sub">${escapeHTML(author.isMe ? 'أنت' : `@${author.handle || 'nabd'}`)} · ${timeAgo(post.createdAt)}</div>
        </div>
        ${post.authorId === 'me' ? `<button class="icon-btn" type="button" data-action="post-options" data-id="${post.id}" aria-label="خيارات المنشور">${icon('i-more')}</button>` : ''}
      </header>
      ${post.text ? `<p class="post-text">${linkify(post.text)}</p>` : ''}
      ${media ? `<div class="post-media">${media}</div>` : ''}
      <div class="post-actions">
        <button class="post-btn like ${post.liked ? 'is-liked' : ''}" type="button" data-action="like-post" data-id="${post.id}" aria-label="إعجاب">
          ${icon(post.liked ? 'i-heart-fill' : 'i-heart')}<span>${formatCount(post.likes)}</span>
        </button>
        <button class="post-btn" type="button" data-action="toggle-comments" data-id="${post.id}" aria-label="التعليقات" aria-expanded="${isOpen}">
          ${icon('i-comment')}<span>${post.comments.length}</span>
        </button>
        <button class="post-btn" type="button" data-action="share-post" data-id="${post.id}" aria-label="مشاركة">
          ${icon('i-share')}
        </button>
        <span class="post-spacer"></span>
        <button class="post-btn ${post.saved ? 'is-saved' : ''}" type="button" data-action="save-post" data-id="${post.id}" aria-label="حفظ">
          ${icon(post.saved ? 'i-bookmark-fill' : 'i-bookmark')}
        </button>
      </div>
      <section class="post-comments" ${isOpen ? '' : 'hidden'}>
        ${postCommentsHTML(post)}
      </section>
    </article>`;
}

export function postCommentsHTML(post) {
  const rows = post.comments.map((comment) => {
    const person = comment.userId === 'me' ? personById('me') : personById(comment.userId);
    return `
      <div class="comment-row">
        ${avatarHTML(person, 'avatar-xs')}
        <div class="comment-body">
          <div class="comment-name">${escapeHTML(person?.name || 'مستخدم نبض')}<span>${timeAgo(comment.createdAt)}</span></div>
          <p>${linkify(comment.text)}</p>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="comment-list">${rows || '<p class="comment-empty">كن أول من يعلّق على هذا المنشور.</p>'}</div>
    <form class="comment-form" data-form="add-comment" data-id="${post.id}">
      ${avatarHTML(state.me, 'avatar-xs')}
      <input name="comment" type="text" maxlength="180" placeholder="أضف تعليقاً..." aria-label="تعليق" autocomplete="off" />
      <button type="submit" aria-label="إرسال التعليق">${icon('i-send')}</button>
    </form>`;
}

/* ------------------------------- Messages ----------------------------- */

export function renderMessages() {
  const view = $('.view[data-view="messages"]');
  if (!view) return;
  view.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow">${icon('i-chat')} تواصل مباشر</span>
        <h1>الرسائل</h1>
        <p class="view-sub">محادثاتك مع الأصدقاء، كلها في مكان واحد.</p>
      </div>
      <button class="icon-btn round" type="button" data-action="new-chat" aria-label="محادثة جديدة" title="محادثة جديدة">
        ${icon('i-add-user')}
      </button>
    </div>

    <label class="search-field">
      ${icon('i-search')}
      <input type="search" id="chat-search" value="${escapeHTML(ui.chatQuery)}" placeholder="ابحث في المحادثات..." aria-label="بحث في المحادثات" autocomplete="off" />
    </label>

    <div class="chat-list" id="chat-list">${chatRowsHTML()}</div>

    <div class="messages-tip">
      ${icon('i-lock')}
      <p>محادثاتك خاصة. لا يراها أحد غيرك ومن تراسلهم.</p>
    </div>
  `;
  hydrateMedia(view);
}

export function chatRowsHTML() {
  const query = ui.chatQuery.trim().toLowerCase();
  const chats = [...state.chats].sort((a, b) => b.updatedAt - a.updatedAt).filter((chat) => {
    if (!query) return true;
    const person = personById(chat.userId);
    const last = chat.messages[chat.messages.length - 1];
    return `${person?.name || ''} ${person?.handle || ''} ${last?.text || ''}`.toLowerCase().includes(query);
  });

  if (!chats.length) {
    return `
      <div class="empty-state">
        <span class="empty-icon">${icon('i-search')}</span>
        <b>لا نتائج</b>
        <p>جرّب البحث باسم آخر أو ابدأ محادثة جديدة.</p>
      </div>`;
  }

  return chats.map((chat) => {
    const person = personById(chat.userId);
    const last = chat.messages[chat.messages.length - 1];
    const isTyping = ui.typingChats.has(chat.id);
    return `
      <button class="chat-row" type="button" data-action="open-chat" data-id="${chat.id}">
        <span class="chat-avatar-wrap">
          ${avatarHTML(person, 'avatar', { online: person?.online })}
        </span>
        <span class="chat-meta">
          <span class="chat-name-row">
            <b>${escapeHTML(person?.name || 'مستخدم نبض')}${verifiedBadge(person)}</b>
            <em>${timeAgo(chat.updatedAt)}</em>
          </span>
          <span class="chat-preview-row">
            <span class="chat-preview ${isTyping ? 'is-typing' : ''}">
              ${isTyping ? 'يكتب الآن...' : escapeHTML((last?.from === 'me' ? 'أنت: ' : '') + (last?.text || 'ابدأ المحادثة'))}
            </span>
            ${chat.unread ? `<span class="unread-badge">${chat.unread > 9 ? '٩+' : chat.unread}</span>` : ''}
          </span>
        </span>
      </button>`;
  }).join('');
}

/* -------------------------------- Games ------------------------------- */

export function renderGames() {
  const view = $('.view[data-view="games"]');
  if (!view) return;
  view.innerHTML = gamesViewHTML({
    getState: () => state,
    saveState,
    toast,
    stopReels
  });
}

/* ------------------------------- Helpers ------------------------------ */

export function autosize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
}
