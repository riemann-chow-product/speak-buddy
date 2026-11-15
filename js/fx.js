/* SpeakBuddy - 即时反馈：合成音效、彩带、庆祝弹窗、数字滚动 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});
  var doc = global.document;
  var ctx = null;
  var enabled = true;

  function audio() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* noop */ } }
    return ctx;
  }

  /* 用振荡器合成短音，无需任何音频文件 */
  var SOUNDS = {
    click: [[440, 0, .05, .05]],
    score: [[523, 0, .09, .07], [659, .09, .09, .07], [784, .18, .15, .08]],
    combo: [[659, 0, .08, .07], [880, .08, .08, .07], [1047, .16, .17, .09]],
    levelup: [[523, 0, .1, .07], [659, .1, .1, .07], [784, .2, .1, .08], [1047, .3, .24, .09]],
    chest: [[392, 0, .08, .07], [523, .08, .08, .07], [659, .16, .1, .08], [880, .26, .26, .09]],
    star: [[880, 0, .07, .06], [1175, .07, .13, .07]],
    error: [[220, 0, .13, .06]]
  };

  function play(name) {
    if (!enabled) return;
    var c = audio();
    if (!c) return;
    var seq = SOUNDS[name] || SOUNDS.click;
    var now = c.currentTime;
    seq.forEach(function (n) {
      var osc = c.createOscillator();
      var gain = c.createGain();
      var t = now + n[1];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n[0], t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(n[3] || .07, t + .012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n[2]);
      osc.connect(gain);
      gain.connect(c.destination);
      try { osc.start(t); osc.stop(t + n[2] + .03); } catch (e) { /* noop */ }
    });
  }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return enabled; }

  function confetti(count) {
    var root = doc.getElementById('fx-root');
    if (!root) return;
    var colors = ['#635BFF', '#14B8A6', '#FFC542', '#F2545B', '#8B7BFF', '#4ADEAE', '#FF9E7A'];
    var n = count || 30;
    for (var i = 0; i < n; i++) {
      var d = doc.createElement('div');
      d.className = 'confetti';
      d.style.left = Math.random() * 100 + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDuration = (1.6 + Math.random() * 1.7) + 's';
      d.style.animationDelay = (Math.random() * .6) + 's';
      root.appendChild(d);
    }
    setTimeout(function () {
      var nodes = root.querySelectorAll('.confetti');
      for (var j = 0; j < nodes.length; j++) nodes[j].remove();
    }, 4300);
  }

  function countUp(el, target, duration) {
    if (!el) return;
    var start = global.performance ? global.performance.now() : Date.now();
    var dur = duration || 700;
    function frame(now) {
      var t = global.performance ? now : Date.now();
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  /** 升级 / 成就 / 宝箱等高光时刻的统一庆祝弹窗 */
  function celebrate(options) {
    var root = doc.getElementById('fx-root');
    if (!root) return;
    options = options || {};
    var d = doc.createElement('div');
    d.className = 'celebrate-mask';
    d.innerHTML = '<div class="celebrate-card">' +
      '<div class="celebrate-icon">' + (options.icon || '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v2a3 3 0 0 0 3 3"/><path d="M16 6h3v2a3 3 0 0 1-3 3"/><path d="M12 14v4"/><path d="M8.5 21h7"/></svg>') + '</div>' +
      '<div class="celebrate-kicker">' + (options.kicker || '解锁新成就') + '</div>' +
      '<h3>' + (options.title || '太棒了') + '</h3>' +
      '<p>' + (options.desc || '') + '</p>' +
      (options.reward ? '<div class="celebrate-reward">' + options.reward + '</div>' : '') +
      '<button class="btn btn-primary" type="button">继续</button>' +
      '</div>';
    root.appendChild(d);
    confetti(options.confetti || 34);
    play(options.sound || 'levelup');
    var close = function () { if (d.parentNode) d.remove(); };
    d.addEventListener('click', function (e) { if (e.target === d || e.target.tagName === 'BUTTON') close(); });
    setTimeout(close, 6500);
  }

  SB.fx = {
    play: play,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    confetti: confetti,
    countUp: countUp,
    celebrate: celebrate
  };
})(window);
