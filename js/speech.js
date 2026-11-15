/* SpeakBuddy - 语音合成 (TTS) 与语音识别 (ASR) 封装
 *
 * TTS 卡顿的三类根因与对应处理：
 *  1. Chrome 下 cancel() 与 speak() 连续调用是竞态，会吞掉新句子的首音节 → 中间留出间隔；
 *  2. 在线音色（localService=false）需要联网取音频，遇到网络抖动会断流/卡顿 → 优先本地音色；
 *  3. 部分音色在非 1.0 语速下播放不连续、或说完后 synthesis 卡在 paused → 看门狗 + 自动重试。
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
  var settings = { voiceURI: '', voiceName: '', rate: 0.92 };
  try {
    var savedTts = JSON.parse(global.localStorage.getItem(TTS_KEY) || 'null');
    if (savedTts) {
      if (typeof savedTts.voiceURI === 'string') settings.voiceURI = savedTts.voiceURI;
      if (typeof savedTts.voiceName === 'string') settings.voiceName = savedTts.voiceName;
      if (typeof savedTts.rate === 'number' && savedTts.rate >= 0.5 && savedTts.rate <= 1.4) settings.rate = savedTts.rate;
    }
  } catch (e) { /* 隐私模式下忽略 */ }

  function saveSettings() {
    try { global.localStorage.setItem(TTS_KEY, JSON.stringify(settings)); } catch (e) { /* noop */ }
  }

  var tokenSeq = 0;
  var current = null;
  var warmedUp = false;
  var lastStatus = { ok: false, voice: '', attempts: 0, reason: '' };

  /* ---------------- 音色 ---------------- */
  function refreshVoices() {
    if (!synthesis) return;
    var list = synthesis.getVoices() || [];
    if (list.length) cachedVoices = list;
  }
  if (synthesis) {
    refreshVoices();
    if ('onvoiceschanged' in synthesis) synthesis.onvoiceschanged = refreshVoices;
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
    if (/Samantha|Alex|Daniel|Ava|Allison|Susan|Fred|Microsoft (Aria|Zira|Jenny|Guy)|Google US English/i.test(n)) q += 10;
    if (/compact|eloquence|novelty|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Jester|Organ|Superstar|Whisper|Wobble|Zarvox/i.test(n)) q -= 60;
    if (/(中文|Chinese|Mandarin|Cantonese)/i.test(n)) q -= 40;
    return q;
  }

  function rankedVoices() {
    return englishVoices().slice().sort(function (a, b) { return quality(b) - quality(a); });
  }

  /** attempt > 1 时换一个音色，避免同一个有问题的音色反复重试。 */
  function pickVoice(attempt) {
    var list = rankedVoices();
    if (!list.length) return null;
    if (attempt <= 1 && settings.voiceURI) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].voiceURI === settings.voiceURI || list[i].name === settings.voiceName) return list[i];
      }
    }
    var idx = attempt > 1 ? 1 : 0;
    return list[Math.min(idx, list.length - 1)] || list[0];
  }

  /** 首次用户手势预热：只加载音色列表并 resume，绝不往队列塞空句子。
   *  Chrome 里一个只含空格、音量为 0 的 utterance 可能永远不结束，会把后续所有朗读卡死。 */
  function warmUp() {
    if (warmedUp || !synthesis) return;
    warmedUp = true;
    try { refreshVoices(); } catch (e) { /* noop */ }
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

  function settle(cur, ok, reason) {
    if (!cur || cur.done) return;
    cur.done = true;
    clearAttempt(cur);
    detachUtter(cur);
    if (current === cur) current = null;
    lastStatus = { ok: ok, voice: cur.voiceName, attempts: cur.attempts, reason: reason || '' };
    cur.resolve({ ok: ok, voice: cur.voiceName, attempts: cur.attempts, reason: reason || '' });
  }

  /** cancel() 会让仍在队列里的 utterance 抛 onerror('interrupted')。
   *  主动取消前必须先解绑回调，否则重试会被自己的 cancel 误判成失败。 */
  function detachUtter(cur) {
    var u = cur && cur.utter;
    if (!u) return;
    u.onstart = null; u.onend = null; u.onerror = null; u.onboundary = null;
    cur.utter = null;
  }

  function safeCancel(cur) {
    if (cur) detachUtter(cur);
    try { synthesis.cancel(); } catch (e) { /* noop */ }
  }

  function abortCurrent() {
    var prev = current;
    if (prev) settle(prev, false, 'interrupted');
    safeCancel(prev);
  }

  function retry(cur, reason) {
    if (cur.done || cur.token !== tokenSeq) return;
    if (cur.attempts >= 2) { settle(cur, false, reason); return; }
    clearAttempt(cur);
    cur.started = false;
    safeCancel(cur);
    // 重试时换音色 + 恢复常速，绕开「语速/音色组合导致的断流」
    var t = setTimeout(function () { startAttempt(cur); }, 160);
    cur.timers.push(t);
  }

  function startAttempt(cur) {
    if (cur.done || cur.token !== tokenSeq) return;
    cur.attempts += 1;
    safeCancel(cur);
    // cancel 是异步的，紧接着 speak 会丢首音节；等一小拍再真正说话
    var t = setTimeout(function () { doSpeak(cur); }, cur.attempts > 1 ? 90 : 30);
    cur.timers.push(t);
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
    u.onend = function () { settle(cur, true, 'end'); };
    u.onerror = function (ev) {
      var err = (ev && ev.error) || 'unknown';
      if (err === 'interrupted' || err === 'canceled') { settle(cur, false, err); return; }
      // 自动播放策略 / 音色不可用：重试也只会再被拒一次，直接把原因交给界面提示
      if (err === 'not-allowed' || err === 'language-unavailable' || err === 'voice-unavailable') {
        settle(cur, false, err); return;
      }
      retry(cur, err);
    };

    try { synthesis.speak(u); } catch (e) { retry(cur, 'exception'); return; }

    // 启动看门狗：在线音色经常「speak 了但根本不出声」
    cur.timers.push(setTimeout(function () {
      if (cur.done) return;
      if (!cur.started) retry(cur, 'no-start');
    }, 1800));

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

  /** 朗读英文。返回 Promise<{ok, voice, attempts, reason}>，结束后 resolve。 */
  function speak(text, options) {
    options = options || {};
    var clean = cleanText(text);
    return new Promise(function (resolve) {
      if (!synthesis || !Utterance || !clean) { resolve({ ok: false, voice: '', attempts: 0, reason: 'unsupported' }); return; }
      abortCurrent();
      var cur = {
        token: ++tokenSeq,
        text: clean,
        options: options,
        resolve: resolve,
        attempts: 0,
        done: false,
        started: false,
        startTime: 0,
        lastBoundary: 0,
        timers: [],
        interval: null,
        voiceName: '',
        utter: null
      };
      current = cur;
      cur.startTime = Date.now();
      // 与上一次 cancel 拉开距离，避免连续切换时首音节被吞
      cur.timers.push(setTimeout(function () { startAttempt(cur); }, 70));
    });
  }

  function stopSpeaking() { abortCurrent(); }

  /* ---------------- 设置 ---------------- */
  function getSettings() {
    return { voiceURI: settings.voiceURI, voiceName: settings.voiceName, rate: settings.rate, status: lastStatus };
  }
  function setVoice(voiceURI, voiceName) {
    settings.voiceURI = voiceURI || '';
    settings.voiceName = voiceName || '';
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
    setRate: setRate
  };
})(window);
