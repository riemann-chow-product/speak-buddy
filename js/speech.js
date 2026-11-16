/* SpeakBuddy - 语音合成 (TTS) 与语音识别 (ASR) 封装
 *
 * 朗读「点了没声音」的三类根因与对应处理：
 *  1. Chrome 下 cancel() 与 speak() 紧挨着调用是竞态，新句子会永远不触发 onstart
 *     → 首次朗读在用户手势里同步 speak，之前不再 cancel；重试时才提前 cancel 并留出间隔；
 *  2. 在线音色（localService=false）/ 失效的音色对象会让 speak() 静默卡住
 *     → 自动选本地音色；第二次尝试不再指定音色，交给浏览器默认引擎；
 *  3. 部分浏览器压根不提供语音合成，或引擎被自动播放策略拦住
 *     → 本地引擎失败后自动改播在线 MP3，保证「点一下就有声音」。
 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  var doc = global.document;
  var Recognition = global.SpeechRecognition || global.webkitSpeechRecognition;
  var synthesis = global.speechSynthesis;
  var Utterance = global.SpeechSynthesisUtterance;
  var cachedVoices = [];

  var TTS_KEY = 'speakbuddy.tts.v1';
  // auto=true 时系统自动挑选并保存一个本地英语音色（用户仍可在设置里手动改）
  var settings = { voiceURI: '', voiceName: '', rate: 0.92, auto: true };
  try {
    var savedTts = JSON.parse(global.localStorage.getItem(TTS_KEY) || 'null');
    if (savedTts) {
      if (typeof savedTts.voiceURI === 'string') settings.voiceURI = savedTts.voiceURI;
      if (typeof savedTts.voiceName === 'string') settings.voiceName = savedTts.voiceName;
      if (typeof savedTts.rate === 'number' && savedTts.rate >= 0.5 && savedTts.rate <= 1.4) settings.rate = savedTts.rate;
      // 兼容旧存档：存过音色就视为手动选择，否则按「自动」处理
      settings.auto = typeof savedTts.auto === 'boolean' ? savedTts.auto : !settings.voiceURI;
    }
  } catch (e) { /* 隐私模式下忽略 */ }

  function saveSettings() {
    try { global.localStorage.setItem(TTS_KEY, JSON.stringify(settings)); } catch (e) { /* noop */ }
  }

  var tokenSeq = 0;
  var current = null;
  var warmedUp = false;
  var unlocked = false; // 本次文档里是否已有过一次成功朗读
  var lastStatus = { ok: false, voice: '', attempts: 0, reason: '', fallback: false };
  var localFailures = 0;   // 连续「本地引擎启动失败」次数
  var localBroken = false; // 本次会话内直接走在线发音，避免每次点击都白等

  // Safari / 部分 Chrome 会要求 audio.play() 必须发生在用户手势的调用栈里。
  // 在线兜底是在本地引擎失败之后（异步）才播放的，手势早已结束，会被拦成
  // NotAllowedError。这里在点击的同步栈里先用一个极短的静音 WAV「解锁」同一个
  // audio 元素，之后换 src 再播就不需要新的手势，也不需要用户去改任何设置。
  var SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  var unlockAudio = null; // 只负责在用户手势里解锁网页音频，绝不参与实际播放
  function primeAudio() {
    if (typeof global.Audio === 'undefined') return;
    try {
      var a = unlockAudio || (unlockAudio = new global.Audio());
      a.preload = 'auto';
      a.src = SILENT_WAV;                 // 每次点击都在手势里重新解锁一次
      var p = a.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* 忽略：仍可稍后重试 */ });
    } catch (e) { /* noop */ }
  }

  /* ---------------- 音色 ---------------- */
  function refreshVoices() {
    if (!synthesis) return;
    try {
      var list = synthesis.getVoices() || [];
      if (list.length) cachedVoices = list;
    } catch (e) { /* noop */ }
  }
  if (synthesis) {
    refreshVoices();
    if ('onvoiceschanged' in synthesis) {
      synthesis.onvoiceschanged = function () { refreshVoices(); ensureVoice(); };
    }
  }

  function englishVoices() {
    if (!cachedVoices.length) refreshVoices();
    return cachedVoices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ''); });
  }

  function quality(v) {
    var n = v.name || '';
    var q = 0;
    if (v.localService === true) q += 100;            // 本地音色不用联网，最不容易卡顿
    if (/en[-_]US/i.test(v.lang)) q += 30;
    else if (/en[-_]GB/i.test(v.lang)) q += 20;
    else if (/^en/i.test(v.lang)) q += 10;
    if (/Samantha|Alex|Ava|Allison|Susan|Daniel|Karen|Moira|Tessa|Microsoft (Aria|Zira|Jenny|Guy)|Google US English/i.test(n)) q += 25;
    // macOS / Chrome 里的搞怪音色（Fred、Eddy、Grandma…）读句子很怪，不适合当标准发音
    if (/Fred|Eddy|Flo|Grandma|Grandpa|Junior|Reed|Rocko|Shelley|compact|eloquence|novelty|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Jester|Organ|Superstar|Whisper|Wobble|Zarvox/i.test(n)) q -= 60;
    if (/(中文|Chinese|Mandarin|Cantonese)/i.test(n)) q -= 40;
    return q;
  }

  function rankedVoices() {
    return englishVoices().slice().sort(function (a, b) { return quality(b) - quality(a); });
  }

  /** 自动模式：把排名最高的（优先本地）英语音色写进设置，界面能直接看到「当前音色」。 */
  function ensureVoice() {
    if (!settings.auto) return;
    var list = rankedVoices();
    if (!list.length) return;
    var best = list[0];
    if (settings.voiceURI !== (best.voiceURI || '') || settings.voiceName !== (best.name || '')) {
      settings.voiceURI = best.voiceURI || '';
      settings.voiceName = best.name || '';
      saveSettings();
    }
  }

  function autoVoice() {
    var list = rankedVoices();
    if (!list.length) return null;
    var v = list[0];
    return { name: v.name || '', lang: v.lang || '', local: v.localService === true };
  }
  ensureVoice();

  /** 第一次用保存的音色；重试时返回 null，不再指定音色，交给浏览器默认引擎。 */
  function pickVoice(attempt) {
    var list = rankedVoices();
    if (!list.length || attempt > 1) return null;
    if (settings.voiceURI) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].voiceURI === settings.voiceURI || list[i].name === settings.voiceName) return list[i];
      }
    }
    return list[0];
  }

  /** 首次用户手势预热：只加载音色列表并 resume，绝不往队列塞空句子。
   *  Chrome 里一个只含空格、音量为 0 的 utterance 可能永远不结束，会把后续所有朗读卡死。 */
  function warmUp() {
    if (warmedUp || !synthesis) return;
    warmedUp = true;
    try { refreshVoices(); ensureVoice(); } catch (e) { /* noop */ }
    try { if (synthesis.paused) synthesis.resume(); } catch (e) { /* noop */ }
  }
  if (doc) {
    var onFirstGesture = function () {
      warmUp();
      doc.removeEventListener('pointerdown', onFirstGesture);
      doc.removeEventListener('keydown', onFirstGesture);
    };
    doc.addEventListener('pointerdown', onFirstGesture);
    doc.addEventListener('keydown', onFirstGesture);
  }

  /* ---------------- 朗读 ---------------- */
  function cleanText(text) {
    return String(text == null ? '' : text)
      .replace(/[’`´]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expectedMs(text, rate) {
    // 约 2.6 词/秒的自然语速，再按 rate 折算；给足余量，避免误判
    var words = text.split(/\s+/).length;
    return Math.max(2600, (words / 2.6) * 1000 / Math.max(0.5, rate) + 1600);
  }

  function clearAttempt(cur) {
    cur.timers.forEach(function (t) { clearTimeout(t); });
    cur.timers = [];
    if (cur.interval) { clearInterval(cur.interval); cur.interval = null; }
  }

  function settle(cur, ok, reason, fallback) {
    if (!cur || cur.done) return;
    cur.done = true;
    clearAttempt(cur);
    detachUtter(cur);
    if (cur.audio) {
      // 在线 MP3 已经在出声：不要在 resolve 时掐断它，让整句自然读完
      if (!(ok && cur.keepPlaying)) { try { cur.audio.pause(); } catch (e) { /* noop */ } }
      cur.audio = null;
    }
    if (current === cur) current = null;
    if (ok) unlocked = true;
    lastStatus = { ok: !!ok, voice: cur.voiceName, attempts: cur.attempts, reason: reason || '', fallback: !!fallback };
    cur.resolve({ ok: !!ok, voice: cur.voiceName, attempts: cur.attempts, reason: reason || '', fallback: !!fallback });
  }

  /** cancel() 会让仍在队列里的 utterance 抛 onerror('interrupted')。
   *  主动取消前必须先解绑回调，否则重试会被自己的 cancel 误判成失败。 */
  function detachUtter(cur) {
    var u = cur && cur.utter;
    if (!u) return;
    u.onstart = null; u.onend = null; u.onerror = null; u.onboundary = null;
    cur.utter = null;
  }

  function safeCancel(cur, force) {
    if (cur) detachUtter(cur);
    try {
      // 只在确实有音频在播/排队（或强制）时 cancel，避免无谓的 cancel→speak 竞态
      if (synthesis && (force || synthesis.speaking || synthesis.pending)) synthesis.cancel();
    } catch (e) { /* noop */ }
  }

  function abortCurrent() {
    var prev = current;
    if (prev) settle(prev, false, 'interrupted');
    safeCancel(prev);
  }

  function retry(cur, reason) {
    if (cur.done || cur.token !== tokenSeq) return;
    if (cur.attempts >= 2) { failOrFallback(cur, reason); return; }
    clearAttempt(cur);
    cur.started = false;
    safeCancel(cur, true);
    // 提前 cancel 并留出一拍，避开 Chrome 的 cancel/speak 竞态
    var t = setTimeout(function () { startAttempt(cur); }, 180);
    cur.timers.push(t);
  }

  function startAttempt(cur) {
    if (cur.done || cur.token !== tokenSeq) return;
    cur.attempts += 1;
    // 关键：这里不再 cancel。Chrome 下 cancel() 紧接 speak() 会让新句子永远不触发
    // onstart（正是「朗读没有启动」的主因）；重试时已在 retry() 里提前 cancel 过。
    try { if (synthesis.paused) synthesis.resume(); } catch (e) { /* noop */ }
    doSpeak(cur);
  }

  function doSpeak(cur) {
    if (cur.done || cur.token !== tokenSeq) return;
    var attempt = cur.attempts;
    var v = pickVoice(attempt);
    var u = new Utterance(cur.text);
    var rate = typeof cur.options.rate === 'number' ? cur.options.rate : settings.rate;
    if (attempt > 1) rate = 1; // 恢复自然语速，排除变速引起的卡顿
    u.lang = cur.options.lang || 'en-US';
    u.rate = Math.max(0.5, Math.min(1.4, rate));
    u.pitch = cur.options.pitch || 1;
    u.volume = 1;
    if (v) { u.voice = v; u.lang = v.lang || u.lang; }
    cur.voiceName = v ? v.name : '系统默认';
    cur.utter = u;
    cur.started = false;
    cur.startTime = Date.now();
    cur.lastBoundary = Date.now();

    u.onstart = function () {
      cur.started = true;
      cur.lastBoundary = Date.now();
      if (cur.options.onStart) cur.options.onStart();
    };
    u.onboundary = function () { cur.lastBoundary = Date.now(); };
    u.onend = function () {
      localFailures = 0;
      settle(cur, true, 'end');
    };
    u.onerror = function (ev) {
      var err = (ev && ev.error) || 'unknown';
      if (err === 'interrupted' || err === 'canceled') { settle(cur, false, err); return; }
      // 自动播放策略 / 音色不可用：重试也只会再被拒一次，交给在线发音兜底
      if (err === 'not-allowed' || err === 'language-unavailable' || err === 'voice-unavailable') {
        failOrFallback(cur, err); return;
      }
      retry(cur, err);
    };

    try { synthesis.speak(u); } catch (e) { retry(cur, 'exception'); return; }

    // 启动看门狗：在线音色经常「speak 了但根本不出声」
    cur.timers.push(setTimeout(function () {
      if (cur.done) return;
      if (!cur.started) retry(cur, 'no-start');
    }, attempt > 1 ? 1200 : 1400));

    var maxMs = expectedMs(cur.text, rate) + 5000;
    cur.interval = setInterval(function () {
      if (cur.done || !cur.started) return;
      try { if (synthesis.paused && !synthesis.speaking) synthesis.resume(); } catch (e) { /* noop */ }
      var idle = Date.now() - cur.lastBoundary;
      var elapsed = Date.now() - cur.startTime;
      // 既没有 boundary 也没有 onend，且已远超预期时长 → 判定卡死并重来
      if (idle > 6500 || elapsed > maxMs) retry(cur, 'stalled');
    }, 700);
  }

  /* ---------------- 在线发音兜底 ----------------
   * 本地引擎起不来时，用 <audio> 播放在线 MP3。英语句子是内置的固定内容，
   * 只把句子文本发给第三方朗读服务，不上传任何录音或用户数据。
   *
   * 重要：这些接口都做了防盗链，浏览器为跨站 <audio> 自动带上 Referer 时，
   * 百度返回 0 字节 text/html、Google 返回 404、有道返回 500。index.html 中的
   * <meta name="referrer" content="no-referrer"> 就是为此而设（实测 Chrome 上
   * audio.referrerPolicy 对媒体元素不生效，只能用文档级策略）。
   * 去掉 Referer 后百度/Google 都能整句朗读，无需切块，也不会像 206 流式响应
   * 那样永远等不到 onended：只要 onplaying 触发（真的出声了）就立即判定成功。
   */
  function onlineUrls(text) {
    // encodeURIComponent 不转义单引号，个别服务遇到裸引号会报错，统一补成 %27
    var q = encodeURIComponent(text).replace(/'/g, '%27');
    return [
      'https://fanyi.baidu.com/gettts?lan=en&text=' + q + '&spd=3&source=web',
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + q,
      'https://dict.youdao.com/dictvoice?audio=' + q + '&le=en'
    ];
  }

  function playOnline(cur) {
    if (typeof global.Audio === 'undefined') { settle(cur, false, 'online-failed'); return; }
    cur.attempts = Math.max(cur.attempts, 1);
    var urls = onlineUrls(cur.text);
    // 每次用全新的元素：避免解锁用的静音片段残留事件串到真实播放上
    var audio = new global.Audio();
    audio.preload = 'auto';
    cur.audio = audio;
    var pi = 0, finished = false, timer = null, ticket = 0;

    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function cleanup() {
      clearTimer();
      audio.onended = null; audio.onerror = null; audio.onplaying = null;
    }
    function next() {
      if (finished || cur.done) return;
      ticket += 1;
      clearTimer();
      try { audio.pause(); } catch (e) { /* noop */ }
      pi += 1;
      tryCurrent();
    }
    function succeed() {
      if (finished || cur.done) return;
      finished = true;
      cleanup();               // 摘掉监听；但不 pause，让这一句自然读完
      cur.started = true;
      cur.keepPlaying = true;  // settle 里据此跳过 pause
      cur.voiceName = '在线发音';
      settle(cur, true, 'online', true);
    }
    function giveUp() {
      if (finished || cur.done) return;
      finished = true;
      cleanup();
      try { audio.pause(); } catch (e) { /* noop */ }
      settle(cur, false, 'online-failed');
    }
    function tryCurrent() {
      if (finished || cur.done) return;
      if (pi >= urls.length) { giveUp(); return; }
      var url = urls[pi];
      var my = ++ticket;
      try { audio.src = url; } catch (e) { next(); return; }
      var p = null;
      try { p = audio.play(); } catch (e) { /* 由 onerror / 超时兜底 */ }
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          if (finished || cur.done || my !== ticket) return;
          next();
        });
      }
      // 迟迟没有真正出声就换下一个源；不再依赖 onended（206 流式响应可能永不触发）
      timer = setTimeout(function () {
        if (finished || cur.done || my !== ticket) return;
        next();
      }, 6000);
    }
    // 静音解锁片段（data: URI）可能残留事件，只接受 http(s) 源的事件
    function isRealSrc() {
      try { return /^https?:/i.test(audio.src); } catch (e) { return true; }
    }
    audio.onplaying = function () {
      if (finished || cur.done || !isRealSrc()) return;
      cur.started = true;
      if (cur.options.onStart) cur.options.onStart();
      succeed();
    };
    audio.onerror = function () {
      if (finished || cur.done || !isRealSrc()) return;
      next();
    };
    tryCurrent();
  }

  function failOrFallback(cur, reason) {
    if (cur.done || cur.token !== tokenSeq) return;
    safeCancel(cur, true); // 停掉可能迟到的本地句子，避免和在线音频叠在一起
    if (cur.options.online === false) { settle(cur, false, reason); return; }
    if (inGesture()) {
      localFailures += 1;
      // 本地引擎一旦失败过，本会话后续点击直接走在线 MP3，不再让用户干等
      if (localFailures >= 1) localBroken = true;
    }
    playOnline(cur);
  }

  /* ---------------- 自动播放解锁状态 ----------------
   * Chrome / Edge 对 speechSynthesis 同样套用 autoplay policy：文档一次用户激活
   * 都没有时，speak() 会直接触发 onerror('not-allowed')，一句都不读。
   * 一次带手势的成功朗读之后，同文档内后续朗读都会放行（sticky activation）。
   */
  function inGesture() {
    try {
      var ua = global.navigator && global.navigator.userActivation;
      if (ua) {
        if (typeof ua.isActive === 'boolean' && ua.isActive) return true;
        if (typeof ua.hasBeenActive === 'boolean') return ua.hasBeenActive;
      }
    } catch (e) { /* noop */ }
    return unlocked;
  }
  function hasGesture() { return inGesture(); }
  function needsGesture() { return !unlocked && !hasGesture(); }
  function isUnlocked() { return unlocked; }

  /** 线上首次加载时 getVoices() 往往还是空的（实测 0 → 199 需要几百毫秒），
   *  只有这时才等待音色；否则朗读会丢掉用户手势（Safari 尤其严格）。 */
  function waitVoices(cur, tries) {
    if (cur.done || cur.token !== tokenSeq) return;
    refreshVoices();
    ensureVoice();
    if ((cachedVoices.length && englishVoices().length) || tries >= 8) {
      cur.timers.push(setTimeout(function () { startAttempt(cur); }, 50));
      return;
    }
    cur.timers.push(setTimeout(function () { waitVoices(cur, tries + 1); }, 120));
  }

  /** 朗读英文。返回 Promise<{ok, voice, attempts, reason, fallback}>，结束后 resolve。 */
  function speak(text, options) {
    options = options || {};
    var clean = cleanText(text);
    return new Promise(function (resolve) {
      if (!clean) { resolve({ ok: false, voice: '', attempts: 0, reason: 'empty', fallback: false }); return; }
      abortCurrent();
      primeAudio(); // 必须在点击的同步调用栈里，异步之后就解锁不了了
      var cur = {
        token: ++tokenSeq,
        text: clean,
        options: options,
        resolve: resolve,
        attempts: 0,
        done: false,
        started: false,
        startTime: Date.now(),
        lastBoundary: Date.now(),
        timers: [],
        interval: null,
        audio: null,
        voiceName: '',
        utter: null
      };
      current = cur;
      warmUp();
      refreshVoices();
      ensureVoice();

      // 本地引擎连续失败过 / 浏览器不提供语音合成 → 直接在线发音，点击立刻出声
      if (localBroken || !synthesis || !Utterance) {
        if (options.online === false) { settle(cur, false, localBroken ? 'no-start' : 'unsupported'); return; }
        playOnline(cur);
        return;
      }
      if (!cachedVoices.length || !englishVoices().length) waitVoices(cur, 0);
      else startAttempt(cur); // 在用户手势的同一调用栈里同步 speak
    });
  }

  function stopSpeaking() { abortCurrent(); }

  /* ---------------- 设置 ---------------- */
  function getSettings() {
    return {
      voiceURI: settings.voiceURI, voiceName: settings.voiceName,
      rate: settings.rate, auto: settings.auto, autoVoice: autoVoice(), status: lastStatus
    };
  }
  function setVoice(voiceURI, voiceName) {
    if (voiceURI) {
      settings.auto = false;
      settings.voiceURI = voiceURI;
      settings.voiceName = voiceName || '';
    } else {
      settings.auto = true;
      settings.voiceURI = '';
      settings.voiceName = '';
      ensureVoice();
    }
    saveSettings();
    return getSettings();
  }
  function setRate(rate) {
    settings.rate = Math.max(0.5, Math.min(1.4, Number(rate) || 0.92));
    saveSettings();
    return getSettings();
  }
  function voiceList() {
    return rankedVoices().map(function (v) {
      return { name: v.name, lang: v.lang, voiceURI: v.voiceURI, local: v.localService === true, quality: quality(v) };
    });
  }

  /** 语音引擎体检：把「为什么没声音」拆成几项可观测的指标。 */
  function diagnostics() {
    var all = [];
    try { all = (synthesis && synthesis.getVoices()) || []; } catch (e) { /* noop */ }
    var en = englishVoices();
    return {
      supported: !!(synthesis && Utterance),
      voices: all.length,
      english: en.length,
      local: en.filter(function (v) { return v.localService === true; }).length,
      speaking: synthesis ? !!synthesis.speaking : false,
      pending: synthesis ? !!synthesis.pending : false,
      paused: synthesis ? !!synthesis.paused : false,
      localBroken: localBroken,
      online: typeof global.Audio !== 'undefined',
      primed: !!unlockAudio,
      autoVoice: autoVoice(),
      status: { ok: lastStatus.ok, voice: lastStatus.voice, attempts: lastStatus.attempts, reason: lastStatus.reason, fallback: lastStatus.fallback }
    };
  }

  /** Chrome 偶尔会卡在 paused / pending，cancel + resume + 重拉音色能救回来。 */
  function resetEngine() {
    try {
      if (current) settle(current, false, 'interrupted');
      safeCancel(null, true);
    } catch (e) { /* noop */ }
    localFailures = 0;
    localBroken = false;
    try {
      if (synthesis) {
        if (synthesis.paused) synthesis.resume();
        refreshVoices();
        ensureVoice();
      }
    } catch (e) { /* noop */ }
    return diagnostics();
  }

  /* ---------------- 语音识别 ---------------- */
  /** 创建一次识别会话。返回 controller 或 null（浏览器不支持）。
   *  onPartial(interimText) / onFinal({transcript, alternatives, confidence}) / onError(err) / onEnd(payload)
   */
  function createRecognizer(options) {
    options = options || {};
    if (!Recognition) return null;
    var rec;
    try { rec = new Recognition(); } catch (e) { return null; }
    rec.lang = options.lang || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    var finalPayload = null;
    var ended = false;

    rec.onresult = function (event) {
      var full = '';
      var alternatives = [];
      var confidence = 0;
      var count = 0;
      for (var i = 0; i < event.results.length; i++) {
        var result = event.results[i];
        full += result[0].transcript + ' ';
        confidence += result[0].confidence || 0;
        count++;
        if (i === event.results.length - 1) {
          for (var j = 0; j < result.length; j++) {
            if (result[j].transcript) alternatives.push(result[j].transcript);
          }
        }
      }
      full = full.trim().replace(/\s+/g, ' ');
      if (event.results[event.results.length - 1].isFinal) {
        if (alternatives.indexOf(full) === -1) alternatives.unshift(full);
        finalPayload = {
          transcript: full,
          alternatives: alternatives,
          confidence: count ? confidence / count : 0
        };
        if (options.onFinal) options.onFinal(finalPayload);
      } else if (options.onPartial) {
        options.onPartial(full);
      }
    };
    rec.onerror = function (event) {
      if (options.onError) options.onError(event.error || 'unknown');
    };
    rec.onend = function () {
      if (ended) return;
      ended = true;
      if (options.onEnd) options.onEnd(finalPayload);
    };

    return {
      start: function () {
        try { rec.start(); return true; } catch (e) { return false; }
      },
      stop: function () { try { rec.stop(); } catch (e) { /* noop */ } },
      abort: function () { try { rec.abort(); } catch (e) { /* noop */ } },
      raw: rec
    };
  }

  function capabilities() {
    return {
      synthesis: !!synthesis,
      recognition: !!Recognition,
      media: !!(global.navigator && global.navigator.mediaDevices && global.navigator.mediaDevices.getUserMedia),
      mediaRecorder: typeof global.MediaRecorder !== 'undefined',
      secure: global.isSecureContext !== false
    };
  }

  SB.speech = {
    speak: speak,
    stopSpeaking: stopSpeaking,
    createRecognizer: createRecognizer,
    capabilities: capabilities,
    warmUp: warmUp,
    voiceList: voiceList,
    settings: getSettings,
    setVoice: setVoice,
    setRate: setRate,
    diagnostics: diagnostics,
    resetEngine: resetEngine,
    needsGesture: needsGesture,
    isUnlocked: isUnlocked
  };
})(window);
