export const APP_NAME = 'نبض';

export const PEOPLE = [
  {
    id: 'R3EM2026',
    name: 'ريم الحربي',
    handle: 'reem',
    bio: 'مصممة واجهات • أصنع الجمال من التفاصيل',
    colors: ['#ff8fb1', '#8b5cf6'],
    initial: 'ر',
    verified: true,
    online: true,
    tag: 'مصممة UI/UX'
  },
  {
    id: 'K4LD7X21',
    name: 'خالد العمر',
    handle: 'khaled',
    bio: 'أكتب حين يهرب الكلام مني',
    colors: ['#38bdf8', '#2563eb'],
    initial: 'خ',
    verified: false,
    online: true,
    tag: 'كاتب'
  },
  {
    id: 'LAMA8S21',
    name: 'لمى الشمري',
    handle: 'lama',
    bio: 'قهوة، كتب، وضوء الصباح',
    colors: ['#fbbf24', '#f97316'],
    initial: 'ل',
    verified: true,
    online: true,
    tag: 'مصورة'
  },
  {
    id: 'F9SAL321',
    name: 'فيصل الدوسري',
    handle: 'faisal',
    bio: 'أصعد الجبال لأرى العالم أفضل',
    colors: ['#34d399', '#0f766e'],
    initial: 'ف',
    verified: false,
    online: false,
    tag: 'مستكشف'
  },
  {
    id: 'DANA6X24',
    name: 'دانة القحطاني',
    handle: 'dana',
    bio: 'ألوان، حركة، وقليل من الجنون',
    colors: ['#f472b6', '#7c3aed'],
    initial: 'د',
    verified: true,
    online: true,
    tag: 'فنانة رقمية'
  },
  {
    id: 'OMAR2K88',
    name: 'عمر الزهراني',
    handle: 'omar',
    bio: 'مبرمج نهاراً، لاعب ليوم كامل',
    colors: ['#fca5a5', '#ef4444'],
    initial: 'ع',
    verified: false,
    online: false,
    tag: 'مطور'
  },
  {
    id: 'NOOR5T19',
    name: 'نور السالم',
    handle: 'noor',
    bio: 'أشارك ما يجعل اليوم أخف',
    colors: ['#a78bfa', '#22d3ee'],
    initial: 'ن',
    verified: false,
    online: true,
    tag: 'صانعة محتوى'
  },
  {
    id: 'YAZE9M77',
    name: 'يزن المطيري',
    handle: 'yazan',
    bio: 'صوت، صورة، وحكاية',
    colors: ['#fde68a', '#f59e0b'],
    initial: 'ي',
    verified: false,
    online: false,
    tag: 'منتج فيديو'
  }
];

export const SUGGESTED_IDS = ['R3EM2026', 'LAMA8S21', 'OMAR2K88', 'YAZE9M77'];

const mins = (n) => n * 60 * 1000;

export function createSeedPosts(now = Date.now()) {
  return [
    {
      id: 'post-1',
      authorId: 'R3EM2026',
      text: 'الغروب هنا يكتب قصيدة كل يوم 🌅\n#لحظة_سكينة',
      image: 'assets/images/post-desert.svg',
      likes: 1284,
      liked: false,
      saved: false,
      createdAt: now - mins(18),
      comments: [
        { id: 'c1', userId: 'K4LD7X21', text: 'ما شاء الله، اللون خرافي 🌅', createdAt: now - mins(15) },
        { id: 'c2', userId: 'LAMA8S21', text: 'أجمل وقت في اليوم بلا منازع', createdAt: now - mins(11) }
      ]
    },
    {
      id: 'post-2',
      authorId: 'K4LD7X21',
      text: 'أفضل قراراتي كانت تلك التي اتخذتها وأنا هادئ... لا مستعجل.\n#تأمل',
      image: null,
      likes: 342,
      liked: false,
      saved: false,
      createdAt: now - mins(52),
      comments: [
        { id: 'c3', userId: 'F9SAL321', text: 'كلام في الصميم.', createdAt: now - mins(40) },
        { id: 'c4', userId: 'OMAR2K88', text: 'أحتاج أطبق هذا من بكرة.', createdAt: now - mins(33) }
      ]
    },
    {
      id: 'post-3',
      authorId: 'LAMA8S21',
      text: 'قهوة الصباح + فكرة جديدة = يوم كامل ☕',
      image: 'assets/images/post-coffee.svg',
      likes: 876,
      liked: false,
      saved: true,
      createdAt: now - mins(100),
      comments: [
        { id: 'c5', userId: 'R3EM2026', text: 'القهوة أولاً، دائماً ☕', createdAt: now - mins(94) },
        { id: 'c6', userId: 'DANA6X24', text: 'هذه اللحظات هي الحياة.', createdAt: now - mins(80) }
      ]
    },
    {
      id: 'post-4',
      authorId: 'me',
      text: 'ضوء الصباح يرسم زوايا جديدة. #تفاصيل',
      image: 'assets/images/post-arch.svg',
      likes: 96,
      liked: false,
      saved: false,
      createdAt: now - mins(130),
      comments: [
        { id: 'c7', userId: 'LAMA8S21', text: 'بداية موفقة ✨', createdAt: now - mins(120) },
        { id: 'c8', userId: 'DANA6X24', text: 'منتظرين المزيد!', createdAt: now - mins(110) }
      ]
    },
    {
      id: 'post-5',
      authorId: 'F9SAL321',
      text: 'صعدنا ثلاث ساعات... والمنظر يستحق كل خطوة ⛰️',
      image: 'assets/images/post-mountains.svg',
      likes: 1932,
      liked: true,
      saved: false,
      createdAt: now - mins(200),
      comments: [
        { id: 'c9', userId: 'K4LD7X21', text: 'واو! وين هذا؟', createdAt: now - mins(188) },
        { id: 'c10', userId: 'F9SAL321', text: 'جبال السودة، يستاهل التعب.', createdAt: now - mins(180) }
      ]
    },
    {
      id: 'post-6',
      authorId: 'DANA6X24',
      text: 'الليلة ألوان مختلفة ✨\n#تصميم',
      image: 'assets/images/post-neon.svg',
      likes: 1547,
      liked: false,
      saved: false,
      createdAt: now - mins(300),
      comments: [
        { id: 'c11', userId: 'R3EM2026', text: 'ألوانك دائماً ملهمة.', createdAt: now - mins(290) },
        { id: 'c12', userId: 'OMAR2K88', text: 'كيف سويتها؟ احتاج أتعلم.', createdAt: now - mins(270) }
      ]
    },
    {
      id: 'post-7',
      authorId: 'me',
      text: 'أول منشور على نبض... خلونا نبدأ ✨',
      image: null,
      likes: 58,
      liked: false,
      saved: false,
      createdAt: now - mins(480),
      comments: [
        { id: 'c13', userId: 'R3EM2026', text: 'أهلاً بك في العائلة 🤍', createdAt: now - mins(470) }
      ]
    },
    {
      id: 'post-8',
      authorId: 'LAMA8S21',
      text: 'المدينة لا تنام، وأنا أحب سهرها 🌃',
      image: 'assets/images/post-city.svg',
      likes: 731,
      liked: false,
      saved: false,
      createdAt: now - mins(720),
      comments: [
        { id: 'c14', userId: 'NOOR5T19', text: 'صورة الليل تحبس الأنفاس.', createdAt: now - mins(700) }
      ]
    },
    {
      id: 'post-9',
      authorId: 'K4LD7X21',
      text: 'قهوة، كتاب، وموسيقى. الوصفة الكاملة ليوم هادئ.',
      image: null,
      likes: 289,
      liked: false,
      saved: false,
      createdAt: now - mins(1440),
      comments: []
    },
    {
      id: 'post-10',
      authorId: 'DANA6X24',
      text: 'فكرة اليوم: اصنع شيئاً لا يفهمه أحد غيرك.',
      image: null,
      likes: 412,
      liked: false,
      saved: false,
      createdAt: now - mins(1680),
      comments: [
        { id: 'c15', userId: 'YAZE9M77', text: 'هذه الجملة وحدها تستحق الحفظ.', createdAt: now - mins(1600) }
      ]
    }
  ];
}

export function createSeedVideos(now = Date.now()) {
  return [
    {
      id: 'vid-1',
      authorId: 'R3EM2026',
      title: 'غروب على الكثبان',
      caption: 'لحظة سكون قبل أن يغيب الضوء 🌅',
      demo: 'dunes',
      mediaKey: null,
      posterKey: null,
      music: 'صوت أصلي — ريم',
      likes: 1284,
      liked: false,
      createdAt: now - mins(35),
      comments: [
        { id: 'vc1', userId: 'LAMA8S21', text: 'ما هذا الجمال! 😍', createdAt: now - mins(30) },
        { id: 'vc2', userId: 'F9SAL321', text: 'صوّرتيها فين؟', createdAt: now - mins(22) }
      ]
    },
    {
      id: 'vid-2',
      authorId: 'DANA6X24',
      title: 'نبض الألوان',
      caption: 'جربت ألوان جديدة الليلة ✨\n#تصميم #حركة',
      demo: 'neon',
      mediaKey: null,
      posterKey: null,
      music: 'Neon Dreams — Dana',
      likes: 863,
      liked: true,
      createdAt: now - mins(120),
      comments: [
        { id: 'vc3', userId: 'R3EM2026', text: 'الحركة سلسة بشكل جنوني!', createdAt: now - mins(110) }
      ]
    },
    {
      id: 'vid-3',
      authorId: 'me',
      title: 'همس المحيط',
      caption: 'أول ريل لي على نبض 🌊',
      demo: 'ocean',
      mediaKey: null,
      posterKey: null,
      music: 'صوت أصلي — ليان',
      likes: 214,
      liked: false,
      createdAt: now - mins(300),
      comments: [
        { id: 'vc4', userId: 'LAMA8S21', text: 'بداية جميلة جداً 🤍', createdAt: now - mins(280) }
      ]
    },
    {
      id: 'vid-4',
      authorId: 'F9SAL321',
      title: 'المدينة بعد منتصف الليل',
      caption: 'الأضواء لا تنطفئ، والحكايات لا تنتهي 🌃',
      demo: 'city',
      mediaKey: null,
      posterKey: null,
      music: 'Midnight Walk — Faisal',
      likes: 2411,
      liked: false,
      createdAt: now - mins(540),
      comments: [
        { id: 'vc5', userId: 'DANA6X24', text: 'الإضاءة مثالية.', createdAt: now - mins(500) },
        { id: 'vc6', userId: 'K4LD7X21', text: 'هذا أفضل ريل شفته اليوم.', createdAt: now - mins(460) }
      ]
    }
  ];
}

export function createSeedChats(now = Date.now()) {
  return [
    {
      id: 'chat-R3EM2026',
      userId: 'R3EM2026',
      unread: 0,
      updatedAt: now - mins(8),
      messages: [
        { id: 'm1', from: 'them', text: 'شفتي الفيديو الجديد؟', at: now - mins(26) },
        { id: 'm2', from: 'me', text: 'نعم! الألوان رهيبة 😍', at: now - mins(20) },
        { id: 'm3', from: 'them', text: 'شكراً حبيبتي 🤍', at: now - mins(8) }
      ]
    },
    {
      id: 'chat-K4LD7X21',
      userId: 'K4LD7X21',
      unread: 2,
      updatedAt: now - mins(34),
      messages: [
        { id: 'm4', from: 'me', text: 'خالد، عندك فكرة للمنشور الجاي؟', at: now - mins(48) },
        { id: 'm5', from: 'them', text: 'تقدر ترسل لي المعرّف مرة ثانية؟', at: now - mins(36) },
        { id: 'm6', from: 'them', text: 'بضيفك عندي في القائمة.', at: now - mins(34) }
      ]
    },
    {
      id: 'chat-LAMA8S21',
      userId: 'LAMA8S21',
      unread: 1,
      updatedAt: now - mins(95),
      messages: [
        { id: 'm7', from: 'them', text: 'أنا جاهزة للجلسة بكرة ☕', at: now - mins(95) }
      ]
    },
    {
      id: 'chat-F9SAL321',
      userId: 'F9SAL321',
      unread: 0,
      updatedAt: now - mins(320),
      messages: [
        { id: 'm8', from: 'them', text: 'الرحلة كانت أسطورية، لازم تروح.', at: now - mins(330) },
        { id: 'm9', from: 'me', text: 'أكيد! أرسل لي الموقع.', at: now - mins(320) }
      ]
    },
    {
      id: 'chat-DANA6X24',
      userId: 'DANA6X24',
      unread: 0,
      updatedAt: now - mins(700),
      messages: [
        { id: 'm10', from: 'them', text: 'بعتلك ملف التصميم على البريد.', at: now - mins(700) }
      ]
    }
  ];
}

export const NOTIFICATIONS = [
  { id: 'n1', type: 'like', userId: 'R3EM2026', text: 'أعجبت بمنشورك', at: 6 },
  { id: 'n2', type: 'follow', userId: 'OMAR2K88', text: 'بدأ بمتابعتك', at: 24 },
  { id: 'n3', type: 'comment', userId: 'LAMA8S21', text: 'علّقت على صورتك: بداية موفقة ✨', at: 65 },
  { id: 'n4', type: 'friend', userId: 'DANA6X24', text: 'أضافتك إلى أصدقائها', at: 140 },
  { id: 'n5', type: 'like', userId: 'F9SAL321', text: 'أعجب بفيديوك', at: 320 }
];

export const CHAT_REPLIES = [
  'هههههه صدق؟',
  'أنا معك في هذه الفكرة 100%.',
  'أرسل لي التفاصيل وأنا أرتبها.',
  'واو، هذا يغيّر كل شيء!',
  'تمام، بخبرك أول ما يصير شيء جديد.',
  'أحببت هذا! ✨',
  'خلنا نكملها بكرة الصباح.',
  'أكيد، أنا موجود.',
  'صدقاً هذا أفضل حديث اليوم 🤍',
  'فكرة رهيبة، جربتها من قبل ونجحت.'
];

export const GAME_INFO = {
  memory: {
    title: 'ذاكرة الصور',
    subtitle: 'اقلب البطاقات وطابق كل زوج قبل انتهاء الوقت',
    icon: '🃏',
    accent: 'linear-gradient(135deg, #ff6a3d, #ff2d78 55%, #8b5cf6)'
  },
  xo: {
    title: 'إكس أو',
    subtitle: 'تحدَّ الذكاء الاصطناعي على لوحة من ٩ مربعات',
    icon: '⭕',
    accent: 'linear-gradient(135deg, #22d3ee, #6366f1)'
  },
  rps: {
    title: 'حجر ورقة مقص',
    subtitle: 'أول من يصل إلى ٥ نقاط يفوز بالجولة',
    icon: '✌️',
    accent: 'linear-gradient(135deg, #34d399, #0ea5e9)'
  }
};
