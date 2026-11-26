(() => {
  const MODES = {
    focus: { minutes: 25, label: 'DEEP FOCUS', color: '#6366f1' },
    short: { minutes: 5, label: 'SHORT BREAK', color: '#10b981' },
    long: { minutes: 15, label: 'LONG BREAK', color: '#22d3ee' }
  };

  const STORAGE_KEY = 'focusflow_studio_v1';
  const RING_CIRCUMFERENCE = 2 * Math.PI * 112;

  const ringEl = document.getElementById('ringProgress');
  const timeEl = document.getElementById('timeDisplay');
  const badgeEl = document.getElementById('modeBadge');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const themeToggle = document.getElementById('themeToggle');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoListEl = document.getElementById('todoList');
  const todoCountEl = document.getElementById('todoCount');
  const activeTaskLabel = document.getElementById('activeTaskLabel');
  const statSessionsEl = document.getElementById('statSessions');
  const statMinutesEl = document.getElementById('statMinutes');
  const sliders = document.querySelectorAll('.sound-slider');

  ringEl.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;

  let state = loadState();
  let currentMode = 'focus';
  let totalSeconds = MODES.focus.minutes * 60;
  let remainingSeconds = totalSeconds;
  let timerId = null;

  // Web Audio API procedural sound engine
  let audioCtx = null;
  const soundNodes = {};

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const today = new Date().toISOString().slice(0, 10);
      if (saved.date !== today) {
        return { date: today, sessions: 0, minutes: 0, todos: saved.todos || [], theme: saved.theme || 'dark' };
      }
      return {
        date: today,
        sessions: saved.sessions || 0,
        minutes: saved.minutes || 0,
        todos: Array.isArray(saved.todos) ? saved.todos : [],
        theme: saved.theme || 'dark'
      };
    } catch {
      return { date: new Date().toISOString().slice(0, 10), sessions: 0, minutes: 0, todos: [], theme: 'dark' };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyTheme() {
    document.body.classList.toggle('light', state.theme === 'light');
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderTimer() {
    timeEl.textContent = formatTime(remainingSeconds);
    document.title = `${formatTime(remainingSeconds)} · FocusFlow Studio`;
    const ratio = remainingSeconds / totalSeconds;
    ringEl.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
    ringEl.style.stroke = MODES[currentMode].color;
    badgeEl.textContent = MODES[currentMode].label;
  }

  function switchMode(mode) {
    stopTimer();
    currentMode = mode;
    totalSeconds = MODES[mode].minutes * 60;
    remainingSeconds = totalSeconds;
    modeTabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderTimer();
  }

  function playChime() {
    try {
      const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      audioCtx = ctx;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.55);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.6);
      });
    } catch {
      // Ignore audio block if autoplay restricted
    }
  }

  function startTimer() {
    if (timerId) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    startPauseBtn.textContent = '⏸ 일시정지';
    timerId = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        renderTimer();
        stopTimer();
        playChime();
        if (currentMode === 'focus') {
          state.sessions += 1;
          state.minutes += MODES.focus.minutes;
          saveState();
          renderStats();
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('FocusFlow Studio', {
            body: currentMode === 'focus' ? '집중 세션 완료! 잠시 휴식하세요.' : '휴식 끝! 다시 집중을 시작할까요?'
          });
        }
        return;
      }
      renderTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    startPauseBtn.textContent = '▶ 집중 시작';
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = totalSeconds;
    renderTimer();
  }

  // Procedural noise generator via Web Audio API (no external MP3)
  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function createNoiseChannel(type) {
    ensureAudioContext();
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.2;
      }
    } else {
      // Rain: pink-ish filtered noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'rain' ? 1100 : type === 'brown' ? 420 : 2400;

    const gain = audioCtx.createGain();
    gain.gain.value = 0;

    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain };
  }

  function setSoundVolume(type, percent) {
    const valEl = document.querySelector(`[data-val="${type}"]`);
    if (valEl) valEl.textContent = `${percent}%`;
    if (percent === 0 && !soundNodes[type]) return;
    if (!soundNodes[type]) {
      soundNodes[type] = createNoiseChannel(type);
    } else {
      ensureAudioContext();
    }
    const maxGain = type === 'white' ? 0.14 : type === 'brown' ? 0.35 : 0.28;
    soundNodes[type].gain.gain.setTargetAtTime((percent / 100) * maxGain, audioCtx.currentTime, 0.05);
  }

  function renderTodos() {
    todoListEl.innerHTML = '';
    let doneCount = 0;
    let firstPending = null;
    state.todos.forEach((todo, index) => {
      if (todo.done) doneCount += 1;
      else if (!firstPending) firstPending = todo.text;

      const li = document.createElement('li');
      li.className = `todo-item${todo.done ? ' done' : ''}`;

      const left = document.createElement('label');
      left.className = 'todo-left';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = todo.done;
      cb.addEventListener('change', () => {
        state.todos[index].done = cb.checked;
        saveState();
        renderTodos();
      });
      const span = document.createElement('span');
      span.textContent = todo.text;
      left.append(cb, span);

      const del = document.createElement('button');
      del.className = 'todo-del';
      del.type = 'button';
      del.textContent = '✕';
      del.addEventListener('click', () => {
        state.todos.splice(index, 1);
        saveState();
        renderTodos();
      });

      li.append(left, del);
      todoListEl.appendChild(li);
    });

    todoCountEl.textContent = `${doneCount} / ${state.todos.length} 완료`;
    activeTaskLabel.textContent = firstPending ? `현재 목표: ${firstPending}` : '할 일을 추가하거나 바로 시작하세요';
  }

  function renderStats() {
    statSessionsEl.textContent = `${state.sessions}회`;
    statMinutesEl.textContent = `${state.minutes}분`;
  }

  startPauseBtn.addEventListener('click', () => {
    if (timerId) stopTimer();
    else startTimer();
  });

  resetBtn.addEventListener('click', resetTimer);

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
  });

  sliders.forEach((slider) => {
    slider.addEventListener('input', (e) => {
      setSoundVolume(e.target.dataset.sound, Number(e.target.value));
    });
  });

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    state.todos.push({ text, done: false });
    todoInput.value = '';
    saveState();
    renderTodos();
  });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement === todoInput) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (timerId) stopTimer();
      else startTimer();
    } else if (e.key === 'r' || e.key === 'R') {
      resetTimer();
    }
  });

  applyTheme();
  renderTimer();
  renderTodos();
  renderStats();
})();
