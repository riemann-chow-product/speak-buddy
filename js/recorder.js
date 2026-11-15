/* SpeakBuddy - 录音、实时音量波形与语音活动特征采集 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  var state = {
    active: false,
    finished: false,
    simulated: false,
    reason: '',
    stream: null,
    ctx: null,
    analyser: null,
    data: null,
    mediaRecorder: null,
    chunks: [],
    levels: [],
    startTime: 0,
    tick: null,
    watchdog: null,
    onLevel: null,
    onAutoStop: null
  };

  var SAMPLE_MS = 60;

  function reset() {
    if (state.tick) clearInterval(state.tick);
    if (state.watchdog) clearTimeout(state.watchdog);
    if (state.stream) {
      try { state.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* noop */ }
    }
    if (state.ctx) {
      try { state.ctx.close(); } catch (e) { /* noop */ }
    }
    state.active = false;
    state.stream = null;
    state.ctx = null;
    state.analyser = null;
    state.mediaRecorder = null;
    state.chunks = [];
    state.levels = [];
    state.tick = null;
    state.watchdog = null;
  }

  function emitLevel(level) {
    state.levels.push(level);
    if (state.onLevel) state.onLevel(level);
  }

  function readLevel() {
    if (!state.analyser || !state.data) return 0;
    state.analyser.getByteTimeDomainData(state.data);
    var sum = 0;
    for (var i = 0; i < state.data.length; i++) {
      var v = (state.data[i] - 128) / 128;
      sum += v * v;
    }
    var rms = Math.sqrt(sum / state.data.length);
    return Math.min(1, rms * 4.2);
  }

  function beginSimulated(options, reason) {
    reset();
    state.active = true;
    state.finished = false;
    state.simulated = true;
    state.reason = reason || 'browser';
    state.onLevel = options.onLevel || null;
    state.onAutoStop = options.onAutoStop || null;
    state.startTime = Date.now();

    var duration = options.simulatedDuration || 2800;
    var phase = 0;
    state.tick = setInterval(function () {
      if (!state.active) return;
      phase += 0.34;
      var envelope = Math.sin(Math.min(1, (Date.now() - state.startTime) / duration) * Math.PI);
      var level = Math.max(0.02, envelope * (0.32 + 0.24 * Math.abs(Math.sin(phase)) + 0.14 * Math.random()));
      emitLevel(Math.min(0.95, level));
    }, SAMPLE_MS);

    state.watchdog = setTimeout(function () {
      stop().then(function (metrics) {
        if (state.onAutoStop) state.onAutoStop(metrics);
      });
    }, duration);

    return Promise.resolve({ mode: 'simulated', reason: state.reason, message: reason });
  }

  /**
   * 开始录音。真实麦克风不可用时自动降级为模拟采集，保证产品流程始终可体验。
   * 返回 Promise<{mode:'real'|'simulated', reason?:string}>
   */
  function start(options) {
    options = options || {};
    var maxMs = options.maxMs || 12000;
    var supported = global.navigator && global.navigator.mediaDevices && global.navigator.mediaDevices.getUserMedia;

    if (!supported) {
      return beginSimulated(options, options.forceDemo ? '手动体验模式' : '当前环境不支持麦克风采集');
    }
    if (options.forceDemo) return beginSimulated(options, '手动体验模式');

    return global.navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    }).then(function (stream) {
      reset();
      state.active = true;
      state.finished = false;
      state.simulated = false;
      state.onLevel = options.onLevel || null;
      state.onAutoStop = options.onAutoStop || null;
      state.startTime = Date.now();
      state.stream = stream;

      var AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (AudioCtx) {
        state.ctx = new AudioCtx();
        if (state.ctx.state === 'suspended') state.ctx.resume();
        state.analyser = state.ctx.createAnalyser();
        state.analyser.fftSize = 1024;
        state.analyser.smoothingTimeConstant = 0.75;
        state.data = new Uint8Array(state.analyser.fftSize);
        state.ctx.createMediaStreamSource(stream).connect(state.analyser);
      }

      if (typeof global.MediaRecorder !== 'undefined') {
        try {
          state.mediaRecorder = new global.MediaRecorder(stream);
          state.mediaRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size) state.chunks.push(e.data);
          };
          state.mediaRecorder.start();
        } catch (e) { state.mediaRecorder = null; }
      }

      state.tick = setInterval(function () {
        if (!state.active) return;
        emitLevel(readLevel());
      }, SAMPLE_MS);

      state.watchdog = setTimeout(function () {
        if (!state.active || state.finished) return;
        stop().then(function (metrics) {
          if (state.onAutoStop) state.onAutoStop(metrics);
        });
      }, maxMs);

      return { mode: 'real' };
    }).catch(function (err) {
      var name = (err && err.name) || '';
      var reason = name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? '麦克风权限被拒绝'
        : name === 'NotFoundError' ? '未检测到麦克风设备' : '无法访问麦克风';
      return beginSimulated(options, reason);
    });
  }

  function buildMetrics() {
    var duration = Math.max(0.4, (Date.now() - state.startTime) / 1000);
    var levels = state.levels.slice();
    var avg = 0, peak = 0, voiced = 0;
    levels.forEach(function (v) { avg += v; peak = Math.max(peak, v); if (v > 0.06) voiced++; });
    avg = levels.length ? avg / levels.length : 0;

    var pauseCount = 0, pauseSamples = 0, quietRun = 0;
    levels.forEach(function (v) {
      if (v < 0.045) quietRun++;
      else {
        if (quietRun >= 4) { pauseCount++; pauseSamples += quietRun; }
        quietRun = 0;
      }
    });
    if (quietRun >= 4) { pauseCount++; pauseSamples += quietRun; }

    var blob = null, url = null;
    if (state.chunks.length && typeof global.Blob !== 'undefined') {
      try {
        blob = new global.Blob(state.chunks, { type: state.mediaRecorder && state.mediaRecorder.mimeType ? state.mediaRecorder.mimeType : 'audio/webm' });
        url = global.URL.createObjectURL(blob);
      } catch (e) { /* noop */ }
    }

    return {
      duration: duration,
      avgLevel: avg,
      peakLevel: peak,
      voicedRatio: levels.length ? voiced / levels.length : 0,
      pauseCount: pauseCount,
      pauseSeconds: pauseSamples * (SAMPLE_MS / 1000),
      levels: levels,
      blob: blob,
      url: url,
      simulated: state.simulated,
      reason: state.reason
    };
  }

  /** 结束采集并返回声学特征。 */
  function stop() {
    if (!state.active) return Promise.resolve(buildMetrics());
    if (state.finished) return Promise.resolve(buildMetrics());
    state.finished = true;
    state.active = false;

    return new Promise(function (resolve) {
      var resolved = false;
      var finish = function () {
        if (resolved) return;
        resolved = true;
        var metrics = buildMetrics();
        reset();
        resolve(metrics);
      };
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.onstop = finish;
        try { state.mediaRecorder.stop(); } catch (e) { finish(); }
        setTimeout(function () { if (state.mediaRecorder) finish(); }, 600);
      } else {
        finish();
      }
    });
  }

  function cancel() {
    state.active = false;
    state.finished = true;
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      try { state.mediaRecorder.stop(); } catch (e) { /* noop */ }
    }
    reset();
  }

  SB.recorder = {
    start: start,
    stop: stop,
    cancel: cancel,
    isActive: function () { return state.active; },
    isSimulated: function () { return state.simulated; }
  };
})(window);
