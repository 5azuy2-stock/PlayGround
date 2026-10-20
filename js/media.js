const DB_NAME = 'nabd_media';
const STORE = 'files';
const DB_VERSION = 1;

let dbPromise = null;
const memoryFallback = new Map();
const urlCache = new Map();

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB غير متاح'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذر فتح قاعدة البيانات'));
  });
  return dbPromise;
}

export async function putMedia(blob) {
  const key = 'm_' + (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`);
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    memoryFallback.set(key, blob);
  }
  return key;
}

export async function getMedia(key) {
  if (!key) return null;
  if (memoryFallback.has(key)) return memoryFallback.get(key);
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function mediaUrl(key) {
  if (!key) return null;
  if (urlCache.has(key)) return urlCache.get(key);
  const blob = await getMedia(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export function cacheUrl(key, url) {
  if (key && url) urlCache.set(key, url);
}

export async function hydrateMedia(root = document) {
  const images = [...root.querySelectorAll('img[data-media]')];
  const videos = [...root.querySelectorAll('video[data-video]')];

  await Promise.all(images.map(async (img) => {
    if (img.dataset.hydrated === '1') return;
    img.dataset.hydrated = '1';
    const posterKey = img.dataset.poster;
    const key = img.dataset.media;
    try {
      if (posterKey) {
        const poster = await mediaUrl(posterKey);
        if (poster) {
          img.src = poster;
          return;
        }
      }
      const url = await mediaUrl(key);
      if (url) img.src = url;
      else img.classList.add('media-missing');
    } catch {
      img.classList.add('media-missing');
    }
  }));

  await Promise.all(videos.map(async (video) => {
    if (video.dataset.hydrated === '1') return;
    video.dataset.hydrated = '1';
    try {
      const posterKey = video.dataset.poster;
      if (posterKey) {
        const poster = await mediaUrl(posterKey);
        if (poster) video.poster = poster;
      }
      const url = await mediaUrl(video.dataset.video);
      if (url) {
        video.src = url;
        video.load();
      } else {
        video.classList.add('media-missing');
      }
    } catch {
      video.classList.add('media-missing');
    }
  }));
}

export async function compressImage(file, maxDimension = 1600, quality = 0.86) {
  if (!file || !file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return blob || file;
}

function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file).catch(() => loadWithImage(file));
  }
  return loadWithImage(file);
}

function loadWithImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذر قراءة الصورة'));
    };
    img.src = url;
  });
}

export function createVideoPoster(file, maxDimension = 900) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ posterBlob: null, duration: 0 }), 9000);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = Math.min(Math.max(0.08, duration * 0.12), 1.2);
      video.currentTime = Number.isFinite(target) ? target : 0;
      video.onseeked = () => {
        try {
          const vw = video.videoWidth || 720;
          const vh = video.videoHeight || 1280;
          const scale = Math.min(1, maxDimension / Math.max(vw, vh));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(vw * scale));
          canvas.height = Math.max(1, Math.round(vh * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => finish({ posterBlob: blob, duration }), 'image/jpeg', 0.82);
        } catch {
          finish({ posterBlob: null, duration });
        }
      };
    };
    video.onerror = () => finish({ posterBlob: null, duration: 0 });
    video.src = url;
  });
}

export function fileSizeLabel(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 م.ب';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} م.ب`;
}
