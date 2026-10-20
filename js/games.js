const MEMORY_SYMBOLS = ['🌙', '⭐', '🌵', '☕', '🎧', '🚀', '🌸', '🍉'];

const GAME_META = {
  memory: { title: 'ذاكرة الصور', subtitle: 'طابق كل الأزواج', icon: '🃏' },
  xo: { title: 'إكس أو', subtitle: 'ضد الذكاء الاصطناعي', icon: '⭕' },
  rps: { title: 'حجر ورقة مقص', subtitle: 'أول من ٥ نقاط', icon: '✌️' }
};

let activeGame = null;

function gamesState(ctx) {
  const state = ctx.getState();
  if (!state.games) {
    state.games = {
      memory: { bestMoves: null, bestTime: null },
      xo: { wins: 0, losses: 0, draws: 0 },
      rps: { wins: 0, losses: 0, draws: 0 }
    };
  }
  if (!state.games.memory) state.games.memory = { bestMoves: null, bestTime: null };
  if (!state.games.xo) state.games.xo = { wins: 0, losses: 0, draws: 0 };
  if (!state.games.rps) state.games.rps = { wins: 0, losses: 0, draws: 0 };
  return state.games;
}

export function gamesViewHTML(ctx) {
  const games = gamesState(ctx);
  const memoryBest = games.memory.bestMoves ? `${games.memory.bestMoves} حركة` : 'لم تُلعب بعد';
  const xoTotal = games.xo.wins + games.xo.losses + games.xo.draws;
  const rpsTotal = games.rps.wins + games.rps.losses + games.rps.draws;

  return `
    <div class="view-head games-head">
      <div>
        <span class="eyebrow"><svg class="ic"><use href="#i-sparkle"></use></svg> استراحة نبض</span>
        <h1>الألعاب</h1>
        <p class="view-sub">نافس أصدقاءك، أو تحدَّ نفسك بين منشور وآخر.</p>
      </div>
    </div>

    <section class="games-hero">
      <div class="games-hero-copy">
        <span class="hero-pill"><svg class="ic"><use href="#i-trophy"></use></svg> تحدي اليوم</span>
        <h2>هل تستطيع كسر رقمك؟</h2>
        <p>ابدأ بجولة سريعة في ذاكرة الصور، أو تحدَّ الذكاء الاصطناعي في إكس أو.</p>
        <button class="btn btn-light" type="button" data-action="open-game" data-game="memory">
          العب الآن <svg class="ic"><use href="#i-play"></use></svg>
        </button>
      </div>
      <div class="games-hero-art" aria-hidden="true">
        <span class="orb orb-a"></span>
        <span class="orb orb-b"></span>
        <span class="trophy-emoji">🏆</span>
      </div>
    </section>

    <div class="section-title-row">
      <h2>كل الألعاب</h2>
      <span class="muted tiny">٣ ألعاب</span>
    </div>

    <div class="game-grid">
      <button class="game-card" type="button" data-action="open-game" data-game="memory">
        <span class="game-card-icon" style="--accent:linear-gradient(135deg,#ff6a3d,#ff2d78 60%,#8b5cf6)">🃏</span>
        <span class="game-card-body">
          <b>ذاكرة الصور</b>
          <span>طابق ٨ أزواج بأقل حركات</span>
          <em>أفضل نتيجة: ${memoryBest}</em>
        </span>
        <svg class="ic game-card-arrow"><use href="#i-back"></use></svg>
      </button>

      <button class="game-card" type="button" data-action="open-game" data-game="xo">
        <span class="game-card-icon" style="--accent:linear-gradient(135deg,#22d3ee,#6366f1)">⭕</span>
        <span class="game-card-body">
          <b>إكس أو</b>
          <span>ثلاثة في صف واحد</span>
          <em>${xoTotal ? `${games.xo.wins} فوز من ${xoTotal} جولة` : 'لم تُلعب بعد'}</em>
        </span>
        <svg class="ic game-card-arrow"><use href="#i-back"></use></svg>
      </button>

      <button class="game-card" type="button" data-action="open-game" data-game="rps">
        <span class="game-card-icon" style="--accent:linear-gradient(135deg,#34d399,#0ea5e9)">✌️</span>
        <span class="game-card-body">
          <b>حجر ورقة مقص</b>
          <span>أول من ٥ نقاط يفوز</span>
          <em>${rpsTotal ? `${games.rps.wins} فوز من ${rpsTotal} جولة` : 'لم تُلعب بعد'}</em>
        </span>
        <svg class="ic game-card-arrow"><use href="#i-back"></use></svg>
      </button>

      <div class="game-card game-card-quiet">
        <span class="game-card-icon quiet">🎲</span>
        <span class="game-card-body">
          <b>المزيد قريباً</b>
          <span>ألعاب جديدة كل أسبوع</span>
          <em>ابقَ على نبض</em>
        </span>
      </div>
    </div>

    <div class="games-tip">
      <svg class="ic"><use href="#i-fire"></use></svg>
      <p><b>نصيحة:</b> أرسل نتيجتك لصديق عبر الرسائل وادعُه للتحدي.</p>
    </div>
  `;
}

export function openGame(type, ctx) {
  if (!GAME_META[type]) return;
  closeGame();
  const root = document.getElementById('overlay-root');
  if (!root) return;
  const meta = GAME_META[type];
  const screen = document.createElement('div');
  screen.className = 'screen game-screen';
  screen.dataset.screen = 'game';
  screen.innerHTML = `
    <header class="game-top">
      <button class="icon-btn round" type="button" data-game-close aria-label="رجوع">
        <svg class="ic"><use href="#i-back"></use></svg>
      </button>
      <div class="game-top-title">
        <span>${meta.icon}</span>
        <div><b>${meta.title}</b><small>${meta.subtitle}</small></div>
      </div>
      <button class="icon-btn round" type="button" data-game-close aria-label="إغلاق">
        <svg class="ic"><use href="#i-close"></use></svg>
      </button>
    </header>
    <div class="game-body" id="game-body"></div>
  `;
  root.appendChild(screen);
  requestAnimationFrame(() => screen.classList.add('is-open'));
  ctx.stopReels?.();

  const body = screen.querySelector('#game-body');
  const cleanupFns = [];
  const register = (fn) => cleanupFns.push(fn);
  activeGame = {
    screen,
    cleanup: () => cleanupFns.forEach((fn) => fn()),
    onClose: typeof ctx.onClose === 'function' ? ctx.onClose : null
  };

  screen.querySelectorAll('[data-game-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeGame());
  });

  if (type === 'memory') startMemory(body, ctx, register);
  if (type === 'xo') startXO(body, ctx, register);
  if (type === 'rps') startRPS(body, ctx, register);
}

export function closeGame() {
  if (!activeGame) return;
  const { cleanup, screen, onClose } = activeGame;
  activeGame = null;
  try { cleanup(); } catch { /* ignore */ }
  screen.classList.add('screen-out');
  setTimeout(() => screen.remove(), 180);
  if (onClose) setTimeout(onClose, 200);
}

export function isGameOpen() {
  return Boolean(activeGame);
}

function save(ctx) {
  ctx.saveState();
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------- Memory ------------------------------- */

function startMemory(body, ctx, register) {
  let deck = [];
  let first = null;
  let lock = false;
  let moves = 0;
  let matched = 0;
  let seconds = 0;
  let interval = null;
  let timeout = null;
  let started = false;
  let finished = false;

  const games = gamesState(ctx);

  body.innerHTML = `
    <div class="game-stats">
      <div class="game-stat"><span>الحركات</span><b id="mem-moves">0</b></div>
      <div class="game-stat"><span>الوقت</span><b id="mem-time">0:00</b></div>
      <div class="game-stat"><span>الأفضل</span><b id="mem-best">${games.memory.bestMoves ? games.memory.bestMoves : '—'}</b></div>
    </div>
    <div class="memory-grid" id="memory-grid"></div>
    <p class="game-hint" id="mem-hint">ابدأ بقلب أي بطاقة — كل زوج متطابق يقرّبك من الفوز.</p>
    <div class="game-result" id="mem-result" hidden></div>
  `;

  const grid = body.querySelector('#memory-grid');
  const movesEl = body.querySelector('#mem-moves');
  const timeEl = body.querySelector('#mem-time');
  const hintEl = body.querySelector('#mem-hint');
  const resultEl = body.querySelector('#mem-result');

  function newDeck() {
    deck = shuffle([...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]).map((symbol, index) => ({
      symbol,
      index,
      matched: false,
      flipped: false
    }));
  }

  function renderGrid() {
    grid.innerHTML = deck.map((card, i) => `
      <button class="mem-card" type="button" data-index="${i}" aria-label="بطاقة ${i + 1}">
        <span class="mem-inner">
          <span class="mem-face mem-back"><svg class="ic"><use href="#i-sparkle"></use></svg></span>
          <span class="mem-face mem-front">${card.symbol}</span>
        </span>
      </button>
    `).join('');
  }

  function updateCard(index) {
    const card = deck[index];
    const el = grid.children[index];
    if (!el) return;
    el.classList.toggle('is-flipped', card.flipped);
    el.classList.toggle('is-matched', card.matched);
    el.disabled = card.matched;
  }

  function startClock() {
    if (started) return;
    started = true;
    interval = setInterval(() => {
      if (finished) return;
      seconds += 1;
      timeEl.textContent = formatClock(seconds);
    }, 1000);
    register(() => clearInterval(interval));
  }

  function resetGame() {
    clearTimeout(timeout);
    clearInterval(interval);
    interval = null;
    started = false;
    finished = false;
    first = null;
    lock = false;
    moves = 0;
    matched = 0;
    seconds = 0;
    movesEl.textContent = '0';
    timeEl.textContent = '0:00';
    resultEl.hidden = true;
    resultEl.innerHTML = '';
    hintEl.textContent = 'ابدأ بقلب أي بطاقة — كل زوج متطابق يقرّبك من الفوز.';
    newDeck();
    renderGrid();
  }

  function finishGame() {
    finished = true;
    clearInterval(interval);
    const best = games.memory;
    const isBest = !best.bestMoves || moves < best.bestMoves || (moves === best.bestMoves && (!best.bestTime || seconds < best.bestTime));
    if (isBest) {
      best.bestMoves = moves;
      best.bestTime = seconds;
      save(ctx);
    }
    body.querySelector('#mem-best').textContent = best.bestMoves || moves;
    hintEl.textContent = isBest ? 'رقم قياسي جديد! 🎉' : 'أحسنت! جرّب حركات أقل هذه المرة.';
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <span class="confetti" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span>
      <b>${isBest ? 'رقم قياسي جديد!' : 'أكملت اللوحة!'}</b>
      <p>${moves} حركة في ${formatClock(seconds)}${isBest ? ' — أفضل نتيجة لك حتى الآن' : ''}</p>
      <div class="result-actions">
        <button class="btn btn-primary" type="button" data-mem-again>العب مرة أخرى</button>
        <button class="btn btn-soft" type="button" data-game-close>رجوع للألعاب</button>
      </div>
    `;
    resultEl.querySelector('[data-mem-again]').addEventListener('click', resetGame);
    resultEl.querySelector('[data-game-close]').addEventListener('click', () => closeGame());
  }

  function onCardClick(event) {
    const btn = event.target.closest('.mem-card');
    if (!btn || lock || finished) return;
    const index = Number(btn.dataset.index);
    const card = deck[index];
    if (!card || card.matched || card.flipped) return;
    startClock();
    card.flipped = true;
    updateCard(index);

    if (first === null) {
      first = index;
      return;
    }

    moves += 1;
    movesEl.textContent = moves;
    const firstCard = deck[first];
    if (firstCard.symbol === card.symbol) {
      firstCard.matched = true;
      card.matched = true;
      matched += 1;
      updateCard(first);
      updateCard(index);
      first = null;
      if (matched === MEMORY_SYMBOLS.length) setTimeout(finishGame, 380);
    } else {
      lock = true;
      hintEl.textContent = 'ليست متطابقة... جرّب مرة أخرى.';
      timeout = setTimeout(() => {
        firstCard.flipped = false;
        card.flipped = false;
        updateCard(first);
        updateCard(index);
        first = null;
        lock = false;
        hintEl.textContent = 'تابع البحث عن الأزواج المتطابقة.';
      }, 760);
    }
  }

  grid.addEventListener('click', onCardClick);
  register(() => clearTimeout(timeout));
  resetGame();
}

/* --------------------------------- XO --------------------------------- */

function startXO(body, ctx, register) {
  let board = Array(9).fill('');
  let over = false;
  let busy = false;
  const games = gamesState(ctx);

  body.innerHTML = `
    <div class="xo-score">
      <div><span>فوزك</span><b id="xo-wins">${games.xo.wins}</b></div>
      <div><span>تعادل</span><b id="xo-draws">${games.xo.draws}</b></div>
      <div><span>خسائر</span><b id="xo-losses">${games.xo.losses}</b></div>
    </div>
    <div class="xo-status" id="xo-status">دورك — أنت X</div>
    <div class="xo-board" id="xo-board" role="grid" aria-label="لوحة إكس أو">
      ${Array.from({ length: 9 }, (_, i) => `<button class="xo-cell" type="button" data-cell="${i}" role="gridcell" aria-label="مربع ${i + 1}"></button>`).join('')}
    </div>
    <button class="btn btn-soft btn-wide" type="button" data-xo-reset>
      <svg class="ic"><use href="#i-refresh"></use></svg> جولة جديدة
    </button>
    <p class="game-hint">أنت تلعب بـ X. اصنع صفاً من ثلاثة قبل الخصم.</p>
  `;

  const boardEl = body.querySelector('#xo-board');
  const statusEl = body.querySelector('#xo-status');
  const winsEl = body.querySelector('#xo-wins');
  const drawsEl = body.querySelector('#xo-draws');
  const lossesEl = body.querySelector('#xo-losses');
  let aiTimeout = null;

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function paint() {
    [...boardEl.children].forEach((cell, i) => {
      const value = board[i];
      cell.textContent = value;
      cell.classList.toggle('is-x', value === 'X');
      cell.classList.toggle('is-o', value === 'O');
      cell.disabled = Boolean(value) || over || busy;
    });
  }

  function winnerOf(state) {
    for (const [a, b, c] of LINES) {
      if (state[a] && state[a] === state[b] && state[a] === state[c]) {
        return { player: state[a], line: [a, b, c] };
      }
    }
    if (state.every(Boolean)) return { player: 'draw', line: [] };
    return null;
  }

  function bestMove(state) {
    let bestScore = -Infinity;
    let choices = [];
    for (let i = 0; i < 9; i += 1) {
      if (state[i]) continue;
      const next = [...state];
      next[i] = 'O';
      const score = minimax(next, 0, false, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        choices = [i];
      } else if (score === bestScore) {
        choices.push(i);
      }
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function minimax(state, depth, isMax, alpha, beta) {
    const result = winnerOf(state);
    if (result) {
      if (result.player === 'O') return 10 - depth;
      if (result.player === 'X') return depth - 10;
      return 0;
    }
    if (isMax) {
      let value = -Infinity;
      for (let i = 0; i < 9; i += 1) {
        if (state[i]) continue;
        state[i] = 'O';
        value = Math.max(value, minimax(state, depth + 1, false, alpha, beta));
        state[i] = '';
        alpha = Math.max(alpha, value);
        if (beta <= alpha) break;
      }
      return value;
    }
    let value = Infinity;
    for (let i = 0; i < 9; i += 1) {
      if (state[i]) continue;
      state[i] = 'X';
      value = Math.min(value, minimax(state, depth + 1, true, alpha, beta));
      state[i] = '';
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  function endRound(result) {
    over = true;
    busy = false;
    if (result.player === 'X') {
      games.xo.wins += 1;
      statusEl.textContent = 'فزت! ثلاثة في صف واحد 🎉';
      statusEl.className = 'xo-status win';
    } else if (result.player === 'O') {
      games.xo.losses += 1;
      statusEl.textContent = 'فاز الخصم هذه المرة 🤖';
      statusEl.className = 'xo-status lose';
    } else {
      games.xo.draws += 1;
      statusEl.textContent = 'تعادل! جولة قوية.';
      statusEl.className = 'xo-status draw';
    }
    result.line.forEach((i) => boardEl.children[i].classList.add('is-line'));
    winsEl.textContent = games.xo.wins;
    drawsEl.textContent = games.xo.draws;
    lossesEl.textContent = games.xo.losses;
    save(ctx);
    paint();
  }

  function aiTurn() {
    if (over) return;
    busy = true;
    statusEl.textContent = 'الخصم يفكر...';
    statusEl.className = 'xo-status thinking';
    paint();
    aiTimeout = setTimeout(() => {
      const move = bestMove(board);
      if (move === undefined) return;
      board[move] = 'O';
      busy = false;
      const result = winnerOf(board);
      if (result) {
        endRound(result);
      } else {
        statusEl.textContent = 'دورك — أنت X';
        statusEl.className = 'xo-status';
        paint();
      }
    }, 460);
    register(() => clearTimeout(aiTimeout));
  }

  boardEl.addEventListener('click', (event) => {
    const cell = event.target.closest('.xo-cell');
    if (!cell || over || busy) return;
    const index = Number(cell.dataset.cell);
    if (board[index]) return;
    board[index] = 'X';
    const result = winnerOf(board);
    if (result) {
      endRound(result);
      return;
    }
    paint();
    aiTurn();
  });

  body.querySelector('[data-xo-reset]').addEventListener('click', () => {
    clearTimeout(aiTimeout);
    board = Array(9).fill('');
    over = false;
    busy = false;
    statusEl.textContent = 'دورك — أنت X';
    statusEl.className = 'xo-status';
    [...boardEl.children].forEach((c) => c.classList.remove('is-line'));
    paint();
  });

  paint();
}

/* --------------------------------- RPS -------------------------------- */

function startRPS(body, ctx, register) {
  const choices = {
    rock: { emoji: '✊', label: 'حجر' },
    paper: { emoji: '✋', label: 'ورقة' },
    scissors: { emoji: '✌️', label: 'مقص' }
  };
  const games = gamesState(ctx);
  let me = 0;
  let ai = 0;
  let busy = false;
  let timeouts = [];

  body.innerHTML = `
    <div class="rps-score">
      <div class="rps-side me"><span>أنت</span><b id="rps-me">0</b></div>
      <div class="rps-vs">VS</div>
      <div class="rps-side ai"><span>الخصم</span><b id="rps-ai">0</b></div>
    </div>
    <div class="rps-stage">
      <div class="rps-hand" id="rps-hand-me">✊</div>
      <div class="rps-shake" id="rps-msg">اختر حركتك</div>
      <div class="rps-hand flip" id="rps-hand-ai">✊</div>
    </div>
    <div class="rps-choices">
      ${Object.entries(choices).map(([key, value]) => `
        <button class="rps-choice" type="button" data-choice="${key}">
          <span>${value.emoji}</span>
          <b>${value.label}</b>
        </button>
      `).join('')}
    </div>
    <p class="game-hint">أول من يصل إلى ٥ نقاط يفوز بالجولة. النتيجة الإجمالية تُحفظ تلقائياً.</p>
    <button class="btn btn-soft btn-wide" type="button" data-rps-reset>
      <svg class="ic"><use href="#i-refresh"></use></svg> إعادة ضبط النقاط
    </button>
  `;

  const meEl = body.querySelector('#rps-me');
  const aiEl = body.querySelector('#rps-ai');
  const handMe = body.querySelector('#rps-hand-me');
  const handAi = body.querySelector('#rps-hand-ai');
  const msg = body.querySelector('#rps-msg');

  function resetScores() {
    me = 0;
    ai = 0;
    meEl.textContent = '0';
    aiEl.textContent = '0';
    msg.textContent = 'اختر حركتك';
    msg.className = 'rps-shake';
    handMe.textContent = '✊';
    handAi.textContent = '✊';
    handMe.classList.remove('pop');
    handAi.classList.remove('pop');
  }

  function resultText(result, myKey, aiKey) {
    if (result === 'draw') return `تعادل! كلاكما اختار ${choices[myKey].label}`;
    if (result === 'me') return `فزت! ${choices[myKey].label} يغلب ${choices[aiKey].label}`;
    return `خسرت هذه الجولة — ${choices[aiKey].label} يغلب ${choices[myKey].label}`;
  }

  function playRound(myKey) {
    if (busy) return;
    busy = true;
    body.querySelectorAll('.rps-choice').forEach((b) => { b.disabled = true; });
    const aiKey = Object.keys(choices)[Math.floor(Math.random() * 3)];
    handMe.textContent = '✊';
    handAi.textContent = '✊';
    msg.textContent = '١...٢...٣';
    msg.className = 'rps-shake is-shaking';
    const t1 = setTimeout(() => {
      handMe.textContent = choices[myKey].emoji;
      handAi.textContent = choices[aiKey].emoji;
      handMe.classList.add('pop');
      handAi.classList.add('pop');
      const t2 = setTimeout(() => {
        handMe.classList.remove('pop');
        handAi.classList.remove('pop');
        let result;
        if (myKey === aiKey) result = 'draw';
        else if (
          (myKey === 'rock' && aiKey === 'scissors') ||
          (myKey === 'paper' && aiKey === 'rock') ||
          (myKey === 'scissors' && aiKey === 'paper')
        ) result = 'me';
        else result = 'ai';

        if (result === 'me') {
          me += 1;
          games.rps.wins += 1;
        } else if (result === 'ai') {
          ai += 1;
          games.rps.losses += 1;
        } else {
          games.rps.draws += 1;
        }
        meEl.textContent = me;
        aiEl.textContent = ai;
        msg.textContent = resultText(result, myKey, aiKey);
        msg.className = `rps-shake result-${result}`;
        save(ctx);

        if (me >= 5 || ai >= 5) {
          const won = me >= 5;
          const t3 = setTimeout(() => {
            msg.innerHTML = won
              ? '🏆 فزت بالجولة! <span class="rps-again">اضغط إعادة الضبط لبدء جولة جديدة</span>'
              : '🤖 فاز الخصم بالجولة. حاول مرة أخرى!';
            msg.className = `rps-shake result-${won ? 'me' : 'ai'} final`;
            if (won) ctx.toast?.('فزت بجولة حجر ورقة مقص 🏆');
          }, 900);
          timeouts.push(t3);
        }
        busy = false;
        body.querySelectorAll('.rps-choice').forEach((b) => { b.disabled = me >= 5 || ai >= 5; });
      }, 700);
      timeouts.push(t2);
    }, 720);
    timeouts.push(t1);
  }

  body.querySelectorAll('.rps-choice').forEach((btn) => {
    btn.addEventListener('click', () => playRound(btn.dataset.choice));
  });

  body.querySelector('[data-rps-reset]').addEventListener('click', () => {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    busy = false;
    body.querySelectorAll('.rps-choice').forEach((b) => { b.disabled = false; });
    resetScores();
  });

  register(() => timeouts.forEach(clearTimeout));
}
