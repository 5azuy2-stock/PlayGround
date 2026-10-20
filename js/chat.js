import {
  state,
  ui,
  $,
  $$,
  icon,
  escapeHTML,
  linkify,
  clockTime,
  dateLabel,
  personById,
  avatarHTML,
  verifiedBadge,
  saveState,
  updateBadges,
  uid,
  pendingReplies,
  toast
} from './core.js';
import { CHAT_REPLIES } from './data.js';
import { renderMessages } from './views.js';
import { hydrateMedia } from './media.js';

export function ensureChat(userId) {
  let chat = state.chats.find((item) => item.userId === userId);
  if (!chat) {
    chat = {
      id: `chat-${userId}`,
      userId,
      unread: 0,
      updatedAt: Date.now(),
      messages: []
    };
    state.chats.unshift(chat);
    saveState();
  }
  return chat;
}

export function messageUser(userId) {
  const chat = ensureChat(userId);
  openChat(chat.id);
}

export function openChat(chatId) {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return;
  closeChatScreen(true);
  ui.chatId = chat.id;
  chat.unread = 0;
  saveState();
  updateBadges();
  renderMessages();

  const person = personById(chat.userId) || { name: 'مستخدم نبض', initial: 'ن', colors: ['#475569', '#1e293b'] };
  const root = $('#overlay-root');
  const screen = document.createElement('div');
  screen.className = 'screen chat-screen';
  screen.dataset.chatId = chat.id;
  screen.innerHTML = `
    <header class="chat-top">
      <button class="icon-btn round" type="button" data-action="close-chat" aria-label="رجوع">
        ${icon('i-back')}
      </button>
      <button class="chat-top-person" type="button" data-action="open-person" data-id="${person.id}">
        ${avatarHTML(person, 'avatar-sm', { online: person.online })}
        <span class="chat-top-info">
          <b>${escapeHTML(person.name)}${verifiedBadge(person)}</b>
          <span>${person.online ? 'متصل الآن' : 'آخر ظهور قبل قليل'}</span>
        </span>
      </button>
      <button class="icon-btn round" type="button" data-action="open-person" data-id="${person.id}" aria-label="معلومات الحساب">
        ${icon('i-more')}
      </button>
    </header>
    <div class="chat-messages" id="chat-messages"></div>
    <form class="chat-composer" data-form="send-message" data-chat="${chat.id}">
      <input name="message" type="text" maxlength="600" placeholder="اكتب رسالة..." autocomplete="off" aria-label="نص الرسالة" />
      <button class="chat-send" type="submit" aria-label="إرسال">
        ${icon('i-send')}
      </button>
    </form>
  `;
  root.appendChild(screen);
  requestAnimationFrame(() => screen.classList.add('is-open'));
  hydrateMedia(screen);
  renderChatMessages(chat);
}

export function closeChatScreen(immediate = false) {
  const screen = $('.screen.chat-screen');
  if (!screen) {
    ui.chatId = null;
    return;
  }
  ui.chatId = null;
  if (immediate) {
    screen.remove();
  } else {
    screen.classList.add('screen-out');
    setTimeout(() => screen.remove(), 220);
  }
  renderMessages();
  updateBadges();
}

export function renderChatMessages(chat) {
  const area = $('#chat-messages');
  if (!area) return;
  const person = personById(chat.userId);
  if (!chat.messages.length) {
    area.innerHTML = `
      <div class="chat-empty">
        ${avatarHTML(person, 'avatar-xl', { online: person?.online })}
        <b>ابدأ المحادثة مع ${escapeHTML(person?.name || 'صديقك')}</b>
        <p>قل مرحباً 👋 وشارك ما يجول في خاطرك.</p>
      </div>`;
    if (ui.typingChats.has(chat.id)) {
      area.insertAdjacentHTML('beforeend', typingHTML(person));
    }
    hydrateMedia(area);
    return;
  }

  let lastDate = '';
  const parts = [];
  chat.messages.forEach((message, index) => {
    const label = dateLabel(message.at);
    if (label !== lastDate) {
      parts.push(`<div class="chat-day"><span>${label}</span></div>`);
      lastDate = label;
    }
    const isMe = message.from === 'me';
    const next = chat.messages[index + 1];
    const showAvatar = !isMe && (!next || next.from !== message.from);
    parts.push(`
      <div class="bubble-row ${isMe ? 'is-me' : 'is-them'}">
        ${!isMe ? (showAvatar ? avatarHTML(person, 'avatar-xxs') : '<span class="avatar-spacer"></span>') : ''}
        <span class="bubble-wrap">
          <span class="bubble">${linkify(message.text)}</span>
          <span class="bubble-time">${clockTime(message.at)}</span>
        </span>
      </div>`);
  });

  if (ui.typingChats.has(chat.id)) parts.push(typingHTML(person));
  area.innerHTML = parts.join('');
  hydrateMedia(area);
  requestAnimationFrame(() => {
    area.scrollTop = area.scrollHeight;
  });
}

function typingHTML(person) {
  return `
    <div class="bubble-row is-them typing-row">
      ${avatarHTML(person, 'avatar-xxs')}
      <span class="typing-bubble"><i></i><i></i><i></i></span>
    </div>`;
}

export function sendChatMessage(form) {
  const chat = state.chats.find((item) => item.id === form.dataset.chat) || state.chats.find((item) => item.id === ui.chatId);
  if (!chat) return;
  const input = form.querySelector('input[name="message"]');
  const text = input?.value.trim();
  if (!text) return;
  chat.messages.push({ id: uid('m'), from: 'me', text, at: Date.now() });
  chat.updatedAt = Date.now();
  chat.unread = 0;
  if (input) input.value = '';
  saveState();
  renderChatMessages(chat);
  scheduleReply(chat);
}

export function scheduleReply(chat) {
  const existing = pendingReplies.get(chat.id);
  if (existing) clearTimeout(existing);
  ui.typingChats.add(chat.id);
  if (ui.chatId === chat.id) renderChatMessages(chat);

  const delay = 1500 + Math.random() * 900;
  const timer = setTimeout(() => {
    pendingReplies.delete(chat.id);
    ui.typingChats.delete(chat.id);
    const current = state.chats.find((item) => item.id === chat.id);
    if (!current) return;
    const reply = CHAT_REPLIES[current.messages.length % CHAT_REPLIES.length];
    current.messages.push({ id: uid('m'), from: 'them', text: reply, at: Date.now() });
    current.updatedAt = Date.now();
    if (ui.chatId === current.id) {
      saveState();
      renderChatMessages(current);
    } else {
      current.unread = (current.unread || 0) + 1;
      saveState();
      renderMessages();
      const person = personById(current.userId);
      toast(`رسالة جديدة من ${person?.name || 'صديقك'}`);
    }
    updateBadges();
  }, delay);
  pendingReplies.set(chat.id, timer);
}
