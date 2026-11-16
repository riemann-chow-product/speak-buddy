/* SpeakBuddy - 应用主逻辑：兴趣引导 / 个性化路线 / 录音评分 / 奖励闭环 */
(function (global) {
  'use strict';
  var SB = global.SB;
  var doc = global.document;
  var FINISH_KEY = 'speakbuddy.lastFinish';

  /* ---------------- 图标 ---------------- */
  var PATHS = {
    home: '<path d="M3 10.4 12 3l9 7.4"/><path d="M5.5 9.2V21h13V9.2"/><path d="M9.5 21v-6.5h5V21"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-6"/><path d="M11 17V5"/><path d="M16 17v-9"/><path d="M21 17v-4"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v2a3 3 0 0 0 3 3"/><path d="M16 6h3v2a3 3 0 0 1-3 3"/><path d="M12 14v4"/><path d="M8.5 21h7"/><path d="M10 18h4"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>',
    play: '<path d="M8 5.5v13L18.5 12 8 5.5z" fill="currentColor" stroke="none"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.2"/><path d="M20 5v6h-6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.6 2.6L16 9.5"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-3.2-2-5.4-3.5-7.5-.4 2-1.5 3-2.7 3.7.4-3.4-1-6-3.3-8.7C9.2 6 5 9.2 5 15.5 5 19.3 8 22 12 22z"/><path d="M12 22c1.8 0 3-1.3 3-3 0-1.5-1-2.5-2-3.5-.3 1.2-1 1.8-1.8 2.2.2-1.6-.3-2.8-1-3.7-.7 1.2-1.2 2.5-1.2 4.5 0 2 1.3 3.5 3 3.5z"/>',
    bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>',
    alert: '<path d="M12 3.5 21 19H3l9-15.5z"/><path d="M12 9.5v4"/><path d="M12 16.5h.01"/>',
    headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="7" rx="2"/><rect x="17.5" y="13" width="4" height="7" rx="2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M7 3v4"/><path d="M17 3v4"/><path d="M3 10h18"/>',
    sparkle: '<path d="M12 2.5 13.9 9l6.6 1.9-6.6 1.9L12 19.5l-1.9-6.7L3.5 11 10.1 9 12 2.5z"/>',
    star: '<path d="M12 2 15 9l7 .6-5.3 4.6 1.6 6.8L12 17.6 5.7 21l1.6-6.8L2 9.6 9 9l3-7z"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M2 12h20"/><path d="M12 8v13"/><path d="M12 8S9 3 7 4.5 9 8 12 8z"/><path d="M12 8s3-5 5-3.5S15 8 12 8z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2 3.4-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2h-4v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-2-3.4.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4.6v-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 2-3.4.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3.4h4v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1 2 3.4-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.2v4h-.2a1.6 1.6 0 0 0-1.4 1z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a9 9 0 0 1-.9-3.9A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z"/>',
    heart: '<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4z"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/><path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M7 3v2"/><path d="M11 3v2"/>',
    code: '<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m13 5-2 14"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 18v3h16v-3"/>',
    upload: '<path d="M12 17V5"/><path d="m7 10 5-5 5 5"/><path d="M4 18v3h16v-3"/>',
    shield: '<path d="M12 2.5 20 6v6c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V6l8-3.5z"/><path d="m9 12 2 2 4-4"/>'
  };
  function icon(name, size) {
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (PATHS[name] || PATHS.info) + '</svg>';
  }
  function star(filled, size) {
    size = size || 15;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" stroke-width="1.5" stroke-linejoin="round" class="' + (filled ? 'star-on' : 'star-off') + '"><path d="M12 2 15 9l7 .6-5.3 4.6 1.6 6.8L12 17.6 5.7 21l1.6-6.8L2 9.6 9 9l3-7z"/></svg>';
  }
  function stars(n, size) {
    var h = '<span class="stars">';
    for (var i = 0; i < 3; i++) h += star(i < n, size);
    return h + '</span>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function ringSVG(pct, size, stroke, color) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#E4E1F7" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/></svg>';
  }
  function scoreColor(t) { return t >= 85 ? '#14B8A6' : t >= 70 ? '#635BFF' : '#F59E0B'; }
  function pad2(n) { return String(n).padStart(2, '0'); }

  /* ---------------- 应用状态 ---------------- */
  var state = {
    route: 'home',
    session: null,
    phase: 'idle',
    demoMode: false,
    recordMode: 'real',
    ending: false,
    recognizer: null,
    recognitionPayload: null,
    recognitionError: null,
    recognitionPromise: null,
    autoMetrics: null,
    waveLevels: [],
    lastResult: null,
    finishData: null,
    showAll: false,
    onb: { selected: [], custom: [], generating: false },
    assessment: null,
    placementResult: null,
    dialogue: null,
    dlgFilter: 'all'
  };

  /* ---------------- 小工具 ---------------- */
  function toast(msg, type) {
    var root = doc.getElementById('toast-root');
    if (!root) return;
    // 同一条消息短时间内不重复堆叠；总量也限制，避免右上角糊成一片
    var old = root.querySelectorAll('.toast');
    for (var i = 0; i < old.length; i++) if (old[i].dataset.msg === msg) old[i].remove();
    while (root.children.length >= 3) root.removeChild(root.firstChild);
    var el = doc.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.dataset.msg = msg;
    el.innerHTML = icon(type === 'warn' ? 'alert' : type === 'success' ? 'checkCircle' : 'info', 15) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '.3s'; setTimeout(function () { el.remove(); }, 320); }, 3100);
  }
  function dailySentence() {
    var all = [];
    SB.data.lessons.forEach(function (l) { l.sentences.forEach(function (s) { all.push(s); }); });
    var d = SB.store.today(), h = 0;
    for (var i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) | 0;
    return all[Math.abs(h) % all.length];
  }
  function current() {
    var lesson = SB.data.getLesson(state.session.lessonId);
    return { lesson: lesson, s: lesson.sentences[state.session.index] };
  }
  function saveFinish(data) { try { global.localStorage.setItem(FINISH_KEY, JSON.stringify(data)); } catch (e) { /* noop */ } }
  function loadFinish() { try { return JSON.parse(global.localStorage.getItem(FINISH_KEY) || 'null'); } catch (e) { return null; } }
  function nextInRoute(lessonId) {
    var order = SB.store.routeOrder();
    var i = order.indexOf(lessonId);
    return (i >= 0 && order[i + 1]) ? SB.data.getLesson(order[i + 1]) : null;
  }

  /* ---------------- 兴趣引导 ---------------- */
  function interestList() {
    return state.onb.selected.map(function (id) {
      var t = SB.route.findTopic(id);
      return { id: id, label: t ? t.label : id, custom: false };
    }).concat(state.onb.custom.map(function (label) {
      return { id: null, label: label, custom: true };
    }));
  }

  function topicGridHTML() {
    return '<div class="topic-grid">' + SB.route.topics.map(function (t, i) {
      var on = state.onb.selected.indexOf(t.id) !== -1;
      return '<button type="button" class="topic-card' + (on ? ' selected' : '') + '" data-action="onb-topic" data-topic="' + t.id + '">' +
        '<span class="t-check">' + icon('check', 12) + '</span>' +
        '<span class="t-icon" style="background:' + t.tint + ';color:' + t.color + '">' + icon(t.icon, 19) + '</span>' +
        '<h4>' + esc(t.label) + (i < 3 ? ' <span style="font-size:9px;color:var(--brand);font-weight:800">热门</span>' : '') + '</h4>' +
        '<div class="t-en">' + esc(t.en) + '</div>' +
        '<p>' + esc(t.desc) + '</p></button>';
    }).join('') + '</div>';
  }

  function customChipsHTML() {
    if (!state.onb.custom.length) return '<span style="font-size:11px;color:var(--ink-4)">还没有自定义话题</span>';
    return state.onb.custom.map(function (c, i) {
      return '<span class="onb-chip">' + esc(c) + '<button type="button" data-action="onb-remove" data-index="' + i + '">' + icon('close', 11) + '</button></span>';
    }).join('');
  }

  function customBoxHTML() {
    return '<div class="onb-custom">' +
      '<label>还想聊点别的？自己写一个</label>' +
      '<div class="hint">比如「篮球」「追剧」「带娃」… 我们会找最接近的课程方向；暂时没有对应课程时会如实告诉你。</div>' +
      '<div class="onb-custom-row"><input id="onb-input" type="text" maxlength="18" placeholder="输入感兴趣的话题，回车添加">' +
      '<button type="button" class="btn btn-soft" data-action="onb-add">添加</button></div>' +
      '<div class="onb-chips" id="onb-chips">' + customChipsHTML() + '</div>' +
      '</div>';
  }

  function refreshTopicUI() {
    var cards = doc.querySelectorAll('.topic-card[data-topic]');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', state.onb.selected.indexOf(cards[i].dataset.topic) !== -1);
    }
    var chips = doc.getElementById('onb-chips');
    if (chips) chips.innerHTML = customChipsHTML();
    var counter = doc.getElementById('onb-counter');
    if (counter) counter.textContent = '已选 ' + (state.onb.selected.length + state.onb.custom.length) + ' 个兴趣 · 内置最多 3 个';
    var btn = doc.getElementById('onb-submit');
    if (btn) btn.disabled = interestList().length === 0;
  }

  function addCustomTopic() {
    var inp = doc.getElementById('onb-input');
    if (!inp) return;
    var v = (inp.value || '').trim();
    if (!v) { toast('先输入一个话题', 'warn'); return; }
    if (state.onb.custom.length >= 2) { toast('最多添加 2 个自定义话题', 'warn'); return; }
    if (state.onb.custom.indexOf(v) !== -1) { toast('已经加过啦', 'warn'); return; }
    state.onb.custom.push(v);
    inp.value = '';
    refreshTopicUI();
    SB.fx.play('click');
  }

  function renderOnboarding() {
    doc.getElementById('app').innerHTML =
      '<div class="onboarding"><div class="onb-wrap">' +
        '<div class="onb-brand"><div class="brand-mark">SB</div><span>SpeakBuddy · 开口说，才真的会</span></div>' +
        '<div class="onb-head">' +
          '<div class="onb-step">STEP 1 / 3 · 选择兴趣</div>' +
          '<h1>你想用英语聊什么？</h1>' +
          '<p>先选场景，再做 1 分钟定级测评，最后按你的水平生成一条专属路线。别担心，测评随时可以跳过或重测。</p>' +
        '</div>' +
        topicGridHTML() + customBoxHTML() +
        '<div class="onb-actions">' +
          '<button type="button" class="btn btn-primary btn-lg" id="onb-submit" data-action="onb-submit">' + icon('target', 17) + ' 下一步 · 开始定级测评</button>' +
          '<div class="onb-hint" id="onb-counter">已选 ' + (state.onb.selected.length + state.onb.custom.length) + ' 个兴趣 · 内置最多 3 个</div>' +
        '</div>' +
        '<div class="onb-restore">' + icon('shield', 14) +
          '<span>更新后记录不见了？不用重新练。</span>' +
          '<button type="button" data-action="backup-modal">从同步码 / 备份文件恢复</button>' +
        '</div>' +
      '</div></div>';
    refreshTopicUI();
  }

  function renderGenerating() {
    doc.getElementById('app').innerHTML =
      '<div class="onboarding"><div class="onb-wrap"><div class="onb-generating">' +
        '<div class="gen-orbit">' + icon('sparkle', 30) + '</div>' +
        '<h2>正在为你排布学习路线</h2>' +
        '<p id="gen-text">正在匹配你的兴趣…</p>' +
        '<div class="gen-track"><span></span></div>' +
      '</div></div></div>';
    var msgs = ['正在匹配你的兴趣…', '正在挑选最适合的句子…', '正在划分初级 / 中级 / 高级…', '快好了，准备出发'];
    var i = 0;
    return setInterval(function () {
      i = Math.min(i + 1, msgs.length - 1);
      var el = doc.getElementById('gen-text');
      if (el) el.textContent = msgs[i];
    }, 420);
  }

  function submitOnboarding(isEdit) {
    if (state.onb.generating) return;
    if (!interestList().length) { toast('至少选一个感兴趣的话题', 'warn'); return; }
    if (isEdit) {
      // 只改兴趣：保留已有定级，不重新测评
      state.onb.generating = true;
      setTimeout(function () {
        var route = SB.store.setInterests(interestList(), SB.store.getPlacement());
        state.onb.generating = false;
        doc.getElementById('modal-root').innerHTML = '';
        renderChrome(); renderView();
        toast('路线已更新：' + route.order.length + ' 关', 'success');
      }, 250);
    } else {
      startAssessment(false);
    }
  }

  /* ---------------- 定级测评 ---------------- */
  function stepsHTML(active) {
    var defs = [{ label: '选择兴趣', icon: 'check' }, { label: '定级测评', icon: 'target' }, { label: '生成路线', icon: 'sparkle' }];
    return '<div class="assess-steps">' + defs.map(function (d, i) {
      var cls = i < active ? 'done' : i === active ? 'active' : '';
      return (i ? '<div class="step-line"></div>' : '') +
        '<div class="assess-step ' + cls + '">' + icon(i < active ? 'check' : d.icon, 14) + '<span>' + d.label + '</span></div>';
    }).join('') + '</div>';
  }

  function levelName(l) { return ['', '初级', '中级', '高级'][l] || '中级'; }

  function startAssessment(isRetest) {
    SB.speech.stopSpeaking();
    try { SB.recorder.cancel(); } catch (e) { /* noop */ }
    state.onb.generating = false;
    state.assessment = {
      isRetest: !!isRetest,
      engine: SB.assessment.makeState(),
      item: null, phase: 'idle', lastScore: null,
      recognizer: null, recognitionPayload: null, recognitionPromise: null,
      autoMetrics: null, waveLevels: [], ending: false, demoNotified: false
    };
    state.placementResult = null;
    doc.getElementById('modal-root').innerHTML = '';
    renderAssessment();
  }

  /** 重测：首次引导内仍算首次流程；已生成路线后重测则保留兴趣、星星与 XP。 */
  function retakeAssessment() {
    startAssessment(!!SB.store.isOnboarded());
  }

  /** 重测中途取消，回到原来的学习界面，水平与路线都不变。 */
  function cancelAssessment() {
    SB.speech.stopSpeaking();
    try { SB.recorder.cancel(); } catch (e) { /* noop */ }
    state.assessment = null;
    state.placementResult = null;
    state.onb.generating = false;
    mount();
    toast('已取消测评，保持当前级别', 'warn');
  }

  function renderAssessment() {
    var a = state.assessment;
    if (!a) return;
    var item = a.item || SB.assessment.nextItem(a.engine);
    a.item = item;
    if (!item) { finishAssessment(); return; }
    var pct = (item.index - 1) / item.total;
    doc.getElementById('app').innerHTML =
      '<div class="onboarding"><div class="assess-wrap">' +
        '<div class="onb-brand"><div class="brand-mark">SB</div><span>SpeakBuddy · 开口说，才真的会</span></div>' +
        stepsHTML(1) +
        '<div class="assess-progress">' +
          '<div class="assess-progress-top"><span>第 ' + item.index + ' / ' + item.total + ' 题</span>' +
          '<span>' + (item.type === 'speaking' ? '跟读发音' : '理解小测') + ' · ' + levelName(item.level) + '难度</span></div>' +
          '<div class="progress-track"><span style="width:' + (pct * 100) + '%"></span></div>' +
        '</div>' +
        '<div class="card assess-card" id="assess-card"></div>' +
        '<div class="assess-footer">' +
          (a.isRetest
            ? '<button class="btn btn-ghost" data-action="assess-cancel">取消，保持当前级别</button>'
            : '<button class="btn btn-ghost" data-action="assess-skip">跳过测评，按中级开始</button>') +
          '<span>约 1 分钟 · 跟读题会自动收音，答完立刻出下一题</span>' +
        '</div>' +
      '</div></div>';
    renderAssessmentQuestion();
  }

  function renderAssessmentQuestion() {
    var a = state.assessment;
    if (!a || !a.item) return;
    var item = a.item;
    var card = doc.getElementById('assess-card');
    if (!card) return;
    if (item.type === 'speaking') {
      var s = item.sentence;
      card.innerHTML =
        '<div class="assess-kind">' + icon('mic', 14) + ' 跟读题 · 照着读一遍，看看发音和流畅度</div>' +
        '<div class="assess-sentence">' + esc(s.en) + '</div>' +
        '<div class="assess-zh">' + esc(s.zh) + '</div>' +
        '<div class="assess-tools">' +
          '<button class="btn btn-ghost" data-action="assess-listen">' + icon('volume', 15) + ' 先听一遍</button>' +
          '<span class="pill">' + esc(s.ipa) + ' · ' + esc(s.key) + '</span>' +
        '</div>' +
        '<div class="wave-area" id="assess-wave"><canvas id="assess-canvas"></canvas>' +
          '<div class="wave-hint" id="assess-hint">点击麦克风开始朗读</div></div>' +
        '<div class="assess-record-row"><button class="record-btn" id="assess-record" data-action="assess-record">' + icon('mic', 30) + '</button></div>' +
        '<div class="record-caption" id="assess-caption">点击麦克风朗读，或按空格键</div>' +
        '<div id="assess-result"></div>';
      a.phase = 'idle';
      a.waveLevels = [];
      updateAssessRecordUI();
      autoReadAssess(item);
    } else {
      var q = item.item;
      card.innerHTML =
        '<div class="assess-kind">' + icon('sparkle', 14) + ' 理解题 · 凭直觉选一个，答完立刻看解析</div>' +
        '<div class="assess-question">' + esc(q.q) + '</div>' +
        '<div class="choice-list">' + q.options.map(function (o, i) {
          return '<button class="choice-option" data-action="assess-choice" data-index="' + i + '">' +
            '<span class="choice-letter">' + 'ABC'[i] + '</span>' + esc(o) + '</button>';
        }).join('') + '</div>' +
        '<div id="assess-result"></div>';
      a.phase = 'choice';
    }
  }

  /** 进入跟读题自动读一遍。但浏览器要求「本次文档有过用户激活」才放行朗读，
   *  线上新域名首次打开 / 刷新后的深链接没有这个许可，硬读只会静默失败，
   *  所以先给「开启发音」按钮，用那一次点击完成解锁并读出当前句。 */
  function autoReadAssess(item) {
    var a = state.assessment;
    if (SB.speech.needsGesture()) { showVoiceGate(item.sentence.en, '听这一句并开启'); return; }
    setTimeout(function () {
      if (state.assessment !== a || !a || a.item !== item || a.phase !== 'idle') return;
      speakText(item.sentence.en, 0.9, null, true);
    }, 280);
  }

  function updateAssessRecordUI() {
    var a = state.assessment;
    if (!a) return;
    var btn = doc.getElementById('assess-record');
    var cap = doc.getElementById('assess-caption');
    var hint = doc.getElementById('assess-hint');
    if (btn) {
      btn.disabled = a.phase === 'analyzing' || a.phase === 'result';
      btn.classList.toggle('recording', a.phase === 'recording');
      btn.innerHTML = icon(a.phase === 'recording' ? 'stop' : 'mic', 30);
    }
    if (cap) cap.textContent = a.phase === 'recording' ? '正在聆听… 读完点一下结束'
      : a.phase === 'analyzing' ? '正在分析发音…'
      : a.phase === 'result' ? '本题完成，点下一题继续'
      : '点击麦克风朗读，或按空格键';
    if (hint) hint.classList.toggle('hidden', a.phase !== 'idle');
  }

  function assessDrawWave(level) {
    var a = state.assessment;
    if (!a) return;
    a.waveLevels.push(level);
    if (a.waveLevels.length > 100) a.waveLevels.shift();
    var c = doc.getElementById('assess-canvas');
    if (!c) return;
    var dpr = global.devicePixelRatio || 1;
    var w = c.clientWidth || 600, h = c.clientHeight || 60;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    var ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var n = a.waveLevels.length, step = 6, bw = 3.6;
    for (var i = 0; i < n; i++) {
      var bh = Math.max(3, a.waveLevels[i] * h * 0.9);
      var x = w - (n - i) * step;
      if (x < -bw) continue;
      ctx.fillStyle = a.phase === 'recording' ? '#635BFF' : '#A9A2F0';
      ctx.globalAlpha = Math.max(.28, i / n);
      ctx.fillRect(x, (h - bh) / 2, bw, bh);
    }
    ctx.globalAlpha = 1;
  }

  function assessBeginRecognition() {
    var a = state.assessment;
    var caps = SB.speech.capabilities();
    if (!caps.recognition || state.demoMode) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var settled = false;
      var done = function (p) { if (settled) return; settled = true; resolve(p || null); };
      var ctrl = SB.speech.createRecognizer({
        onFinal: function (p) { a.recognitionPayload = p; },
        onPartial: function () {},
        onError: function () {},
        onEnd: function (p) { done(p || a.recognitionPayload); }
      });
      if (!ctrl) { done(null); return; }
      a.recognizer = ctrl;
      if (!ctrl.start()) { done(null); return; }
      setTimeout(function () { done(a.recognitionPayload); }, 12500);
    });
  }

  function startAssessRecording() {
    var a = state.assessment;
    if (!a || a.phase !== 'idle') return;
    SB.speech.stopSpeaking();
    a.phase = 'recording';
    a.ending = false;
    a.waveLevels = [];
    a.autoMetrics = null;
    a.recognitionPayload = null;
    a.recognitionPromise = assessBeginRecognition();
    SB.fx.play('click');
    var caps = SB.speech.capabilities();
    SB.recorder.start({
      maxMs: 12000,
      forceDemo: state.demoMode || !caps.recognition,
      simulatedDuration: 2100 + Math.min(2200, a.item.sentence.en.split(' ').length * 220),
      onLevel: assessDrawWave,
      onAutoStop: function (metrics) { a.autoMetrics = metrics; endAssessRecording(); }
    }).then(function (info) {
      // 一次测评只提示一次，避免 4 道跟读题堆出 4 条相同的 toast
      if (info.mode === 'simulated' && state.assessment === a && !a.demoNotified) {
        a.demoNotified = true;
        toast('麦克风不可用，跟读题按体验评分计入', 'warn');
      }
    });
    updateAssessRecordUI();
  }

  function endAssessRecording() {
    var a = state.assessment;
    if (!a || a.phase !== 'recording' || a.ending) return;
    a.ending = true;
    a.phase = 'analyzing';
    updateAssessRecordUI();
    if (a.recognizer) { try { a.recognizer.stop(); } catch (e) { /* noop */ } }
    var metricsP = a.autoMetrics ? Promise.resolve(a.autoMetrics) : SB.recorder.stop();
    var recP = Promise.race([
      a.recognitionPromise || Promise.resolve(null),
      new Promise(function (r) { setTimeout(function () { r(a.recognitionPayload); }, 2200); })
    ]);
    Promise.all([metricsP, recP]).then(function (arr) {
      if (state.assessment !== a || !a.item) return; // 中途取消或重测，丢弃旧结果
      var metrics = arr[0] || {};
      // 录音降级为模拟时，即使识别器偶发返回文本，也不能当成真实发音计入定级
      var rec = (metrics.simulated || state.demoMode) ? null : arr[1];
      var result = SB.scoring.score({
        sentence: a.item.sentence,
        transcript: rec && rec.transcript,
        alternatives: rec && rec.alternatives,
        metrics: metrics,
        combo: 0,
        allowDemo: !!state.demoMode
      });
      // 没识别到发音不参与定级，也不给分，留在本题重新录音
      if (result.noSpeech) {
        a.phase = 'result';
        a.ending = false;
        showAssessScore(result);
        return;
      }
      SB.assessment.applySpeaking(a.engine, a.item, result);
      a.lastScore = result.total;
      a.phase = 'result';
      a.ending = false;
      showAssessScore(result);
    });
  }

  function showAssessScore(result) {
    var box = doc.getElementById('assess-result');
    if (!box) return;
    if (result.noSpeech) { box.innerHTML = noSpeechHTML(result, 'assess-retry'); updateAssessRecordUI(); return; }
    var word = result.total >= 85 ? '很稳！' : result.total >= 70 ? '不错，继续' : '再练练会更好';
    box.innerHTML = '<div class="assess-score">' +
      '<div class="assess-score-num">' + result.total + '</div>' +
      '<div class="assess-score-text"><b>' + word + '</b><span>' +
      (result.demo ? '体验评分（未获取到语音识别）' : '本题发音得分') + ' · 下一题难度会据此调整</span></div>' +
      '<button class="btn btn-primary" data-action="assess-next">下一题 ' + icon('arrowRight', 14) + '</button></div>';
    updateAssessRecordUI();
    SB.fx.play(result.total >= 85 ? 'score' : 'star');
    if (result.total >= 85) SB.fx.confetti(10);
  }

  function answerChoice(idx) {
    var a = state.assessment;
    if (!a || a.phase !== 'choice') return;
    var r = SB.assessment.applyChoice(a.engine, a.item, idx);
    a.phase = 'choice-result';
    var opts = doc.querySelectorAll('.choice-option');
    for (var i = 0; i < opts.length; i++) {
      if (i === r.answer) opts[i].classList.add('correct');
      else if (i === idx) opts[i].classList.add('wrong');
      opts[i].setAttribute('data-action', 'noop');
    }
    var box = doc.getElementById('assess-result');
    if (box) box.innerHTML = '<div class="choice-explain ' + (r.correct ? 'ok' : 'no') + '">' +
      icon(r.correct ? 'checkCircle' : 'info', 16) +
      '<div><b>' + (r.correct ? '答对了' : '正确答案：' + 'ABC'[r.answer] + ' · ' + esc(a.item.item.options[r.answer])) + '</b>' +
      '<span>' + esc(r.explain) + '</span></div>' +
      '<button class="btn btn-primary" data-action="assess-next">下一题 ' + icon('arrowRight', 14) + '</button></div>';
    SB.fx.play(r.correct ? 'star' : 'error');
  }

  function nextAssessmentItem() {
    var a = state.assessment;
    if (!a) return;
    if (a.engine.answers.length >= SB.assessment.total) { finishAssessment(); return; }
    a.item = null;
    a.phase = 'idle';
    a.lastScore = null;
    a.waveLevels = [];
    renderAssessment();
  }

  function finishAssessment() {
    var a = state.assessment;
    if (!a) return;
    var p = SB.assessment.grade(a.engine);
    state.placementResult = p;
    renderPlacementResult(p);
    SB.fx.play('levelup');
    SB.fx.confetti(34);
  }

  function renderPlacementResult(p) {
    var meta = SB.assessment.levels[p.level];
    doc.getElementById('app').innerHTML =
      '<div class="onboarding"><div class="onb-wrap placement-wrap">' +
        '<div class="onb-brand"><div class="brand-mark">SB</div><span>SpeakBuddy · 开口说，才真的会</span></div>' +
        stepsHTML(2) +
        '<div class="card placement-card">' +
          '<div class="placement-badge" style="background:' + p.tint + ';color:' + p.color + '">' + icon('target', 34) + '</div>' +
          '<div class="placement-kicker">定级完成</div>' +
          '<h1>你是 <span style="color:' + p.color + '">' + esc(p.label) + '</span></h1>' +
          '<div class="placement-score"><b>' + p.score + '</b><span>综合得分 / 100</span></div>' +
          '<p class="placement-desc">' + esc(p.desc) + '</p>' +
          '<div class="placement-metrics">' +
            '<div><b>' + p.speaking + '</b><span>跟读发音</span></div>' +
            '<div><b>' + p.choice + '</b><span>理解正确率</span></div>' +
            '<div><b>' + esc(meta.short) + '</b><span>建议起点</span></div>' +
          '</div>' +
          (p.demo ? '<div class="route-note">' + icon('info', 14) + ' 跟读题未获取到真实语音识别，已降低发音权重、主要依据理解题定级' + (p.capped ? '，并保守封顶为中级，避免一下跳过太多关卡' : '') + '。用 Chrome 打开并允许麦克风后重测可解锁高级起点。</div>' : '') +
          '<div class="placement-hint">' + icon('sparkle', 16) + '<div><b>路线怎么排：</b>' + esc(p.routeHint) + '</div></div>' +
          '<div class="placement-actions">' +
            '<button class="btn btn-ghost" data-action="assess-retake">重新测一次</button>' +
            '<button class="btn btn-primary btn-lg" data-action="placement-confirm">' + icon('sparkle', 17) + ' 生成我的学习路线</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
  }

  function completeOnboarding(placement) {
    if (state.onb.generating) return;
    state.onb.generating = true;
    var isRetest = !!(state.assessment && state.assessment.isRetest);
    var timer = renderGenerating();
    setTimeout(function () {
      clearInterval(timer);
      var route = isRetest
        ? SB.store.setPlacement(placement)
        : SB.store.setInterests(interestList(), placement);
      state.assessment = null;
      state.placementResult = null;
      state.onb.generating = false;
      SB.fx.play('levelup');
      mount();
      var lv = SB.assessment.levels[route.startStage];
      toast('路线已生成：' + route.order.length + ' 关 · 从' + (lv ? lv.short : '中级') + '开始', 'success');
    }, 1500);
  }

  function skipAssessment() {
    toast('已跳过测评，默认从中级开始；随时可以在「我的水平」里补测', 'warn');
    completeOnboarding(null);
  }

  function showInterestModal() {
    var saved = SB.store.interests();
    state.onb.selected = saved.filter(function (x) { return !x.custom && SB.route.findTopic(x.id); }).map(function (x) { return x.id; });
    state.onb.custom = saved.filter(function (x) { return x.custom; }).map(function (x) { return x.label; });
    doc.getElementById('modal-root').innerHTML =
      '<div class="modal-mask"><div class="modal interest-modal">' +
        '<h3>调整我的兴趣</h3>' +
        '<p>换一批话题会重排路线；定级水平、星星和 XP 都会保留。想改起点，可以单独重新测评。</p>' +
        topicGridHTML() + customBoxHTML() +
        '<div class="modal-actions" style="margin-top:18px">' +
          '<button type="button" class="btn btn-ghost" data-action="assess-retake">重新测评</button>' +
          '<button type="button" class="btn btn-ghost" data-action="close-modal">取消</button>' +
          '<button type="button" class="btn btn-primary" id="onb-submit" data-action="onb-submit-edit">重新生成路线</button>' +
        '</div>' +
      '</div></div>';
    refreshTopicUI();
  }

  /* ---------------- 路由 ---------------- */
  function parseRoute() {
    var h = (global.location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/');
    var allowed = ['home', 'practice', 'finish', 'stats', 'achievements', 'dialogue'];
    return { name: allowed.indexOf(parts[0]) !== -1 ? parts[0] : 'home', param: parts[1] || null };
  }
  function go(hash) {
    if (global.location.hash === hash) { onRoute(); return; }
    global.location.hash = hash;
  }
  function resetSession(lessonId) {
    state.session = { lessonId: lessonId, index: 0, results: [], finished: false };
    clearSentence();
  }
  function ensureSession(lessonId) {
    if (!state.session || state.session.lessonId !== lessonId || state.session.finished) resetSession(lessonId);
  }
  function clearSentence() {
    state.phase = 'idle';
    state.ending = false;
    state.lastResult = null;
    state.autoMetrics = null;
    state.waveLevels = [];
    state.recognizer = null;
    state.recognitionPayload = null;
    state.recognitionError = null;
    state.recognitionPromise = null;
    var slot = doc.getElementById('feedback-slot');
    if (slot) slot.innerHTML = '';
    var live = doc.getElementById('live-text');
    if (live) live.textContent = '';
  }
  function onRoute() {
    // 测评 / 定级结果 / 路线生成页是独立全屏视图，交给自己的渲染器接管
    if (state.assessment) return;
    if (!SB.store.isOnboarded()) { renderOnboarding(); return; }
    SB.store.ensureRoute();
    var r = parseRoute();
    state.route = r.name;
    if (r.name === 'practice') {
      var lesson = SB.data.getLesson(r.param);
      if (!lesson) { go('#/home'); return; }
      ensureSession(lesson.id);
      clearSentence();
    } else if (r.name === 'dialogue') {
      if (r.param) {
        var sc = SB.dialogue.get(r.param);
        if (!sc) { go('#/dialogue'); return; }
        if (!state.dialogue || state.dialogue.id !== sc.id || state.dialogue.finished) startDialogue(sc.id);
        state.route = 'dialogue-play';
      } else {
        state.route = 'dialogue';
      }
    } else {
      // 离开对话页时停止对方台词的朗读，避免后台还在说话
      SB.speech.stopSpeaking();
      if (state.dialogue && !state.dialogue.finished && SB.recorder.isActive()) SB.recorder.cancel();
    }
    renderChrome();
    renderView();
    var main = doc.getElementById('main');
    if (main) main.scrollTop = 0;
  }

  /* ---------------- 外壳 ---------------- */
  function topbarTitle() {
    if (state.route === 'home') return ['我的学习路线', '按你选的兴趣，循序渐进'];
    if (state.route === 'practice') {
      var l = state.session && SB.data.getLesson(state.session.lessonId);
      return [l ? '跟读练习 · ' + l.title : '跟读练习', '听标准发音 → 跟读 → 逐词纠音'];
    }
    if (state.route === 'dialogue') return ['情景对话', '对方先开口，你来把话接住'];
    if (state.route === 'dialogue-play') {
      var dsc = state.dialogue && SB.dialogue.get(state.dialogue.id);
      return [dsc ? '情景对话 · ' + dsc.title : '情景对话', '听懂 → 自己组织一句话 → 看沟通达成度'];
    }
    if (state.route === 'finish') return ['练习结算', '看看这次练得怎么样'];
    if (state.route === 'stats') return ['学习统计', '把每一次开口都记下来'];
    return ['成就徽章', '坚持的小小证据'];
  }
  function renderChrome() {
    if (!doc.getElementById('sidebar')) return;
    var st = SB.store.get();
    var today = SB.store.todayStats();
    var goal = SB.data.dailyGoal;
    var caps = SB.speech.capabilities();
    var combo = SB.store.comboInfo();
    var pct = Math.min(1, today.sentences / goal.sentences);
    var t = topbarTitle();
    var nav = [
      { id: 'home', label: '学习路线', icon: 'home' },
      { id: 'dialogue', label: '情景对话', icon: 'chat' },
      { id: 'stats', label: '数据统计', icon: 'chart' },
      { id: 'achievements', label: '成就徽章', icon: 'trophy' }
    ];
    var navActive = state.route === 'practice' || state.route === 'finish' ? 'home'
      : state.route === 'dialogue-play' ? 'dialogue' : state.route;

    doc.getElementById('sidebar').innerHTML =
      '<div class="brand"><div class="brand-mark">SB</div><div><div class="brand-name">SpeakBuddy</div><div class="brand-sub">开口说，才真的会</div></div></div>' +
      '<div><div class="nav-label">学习空间</div><nav class="nav">' +
      nav.map(function (n) {
        return '<button class="nav-item' + (navActive === n.id ? ' active' : '') + '" data-action="nav" data-to="' + n.id + '" title="' + n.label + '">' + icon(n.icon, 18) + '<span>' + n.label + '</span>' +
          (n.id === 'achievements' ? '<span class="nav-badge">' + st.achievements.length + '</span>' : '') + '</button>';
      }).join('') + '</nav></div>' +
      '<div class="side-goal">' +
        '<div class="side-goal-title">' + icon('bolt', 14) + ' 学习状态</div>' +
        '<div class="side-goal-row"><div style="position:relative;width:62px;height:62px;flex:0 0 62px">' + ringSVG(SB.store.level().progress, 62, 6, '#F59E0B') +
          '<div style="position:absolute;inset:0;display:grid;place-items:center;font-size:12px;font-weight:800;color:#C57A0C">Lv.' + SB.store.level().level + '</div></div>' +
          '<div class="side-goal-text">最高连击 <b>x' + (combo.best || 0) + '</b><br>累计 ' + st.totalSentences + ' 句 · ' + SB.store.totalStars() + ' 星</div></div>' +
        '<div class="side-progress"><span style="width:' + (SB.store.level().progress * 100) + '%;background:linear-gradient(90deg,#F59E0B,#FFC542)"></span></div>' +
        '<div class="cap-line"><span class="cap-dot' + (caps.recognition && caps.media ? '' : ' off') + '"></span>' +
          (combo.combo >= 2 ? '连击 x' + combo.combo + ' · XP ×' + combo.multiplier : (caps.recognition && caps.media ? '语音识别已就绪' : '当前为体验评分模式')) + '</div>' +
      '</div>';

    doc.getElementById('topbar').innerHTML =
      '<div class="topbar-title">' + esc(t[0]) + '<small>' + esc(t[1]) + '</small></div>' +
      '<div class="topbar-spacer"></div>' +
      (combo.combo >= 2 ? '<span class="combo-badge">' + icon('flame', 13) + ' 连击 x' + combo.combo + '</span>' : '') +
      '<span class="chip warm">' + icon('flame', 14) + ' ' + (st.streak || 0) + ' 天</span>' +
      '<span class="chip">' + icon('star', 14) + ' ' + SB.store.totalStars() + ' 星</span>' +
      '<span class="chip violet">' + icon('bolt', 14) + ' ' + st.xp + ' XP</span>' +
      '<button class="icon-btn" data-action="toggle-sound" title="' + (SB.store.isSoundOn() ? '关闭音效' : '开启音效') + '">' + icon(SB.store.isSoundOn() ? 'volume' : 'mute', 16) + '</button>' +
      '<button class="icon-btn" data-action="tts-settings" title="发音设置：音色 / 语速">' + icon('headphones', 16) + '</button>' +
      '<button class="icon-btn" data-action="edit-interests" title="调整兴趣">' + icon('settings', 16) + '</button>' +
      '<button class="mode-toggle' + (state.demoMode ? ' on' : '') + '" data-action="toggle-mode" title="切换体验模式"><span class="switch"></span>体验模式</button>' +
      '<div class="avatar">SB</div>';
  }

  /* =====================================================================
     情景对话：对方先开口 → 用户自由回应 → 按「沟通达成度」反馈
     与跟读的区别：不要求逐字复现，判定是否把这句话的交际目的说到了。
     ===================================================================== */
  function dlgScenario() { return state.dialogue ? SB.dialogue.get(state.dialogue.id) : null; }
  function dlgTurn() {
    var sc = dlgScenario();
    return sc && state.dialogue ? sc.turns[state.dialogue.index] : null;
  }

  function startDialogue(id) {
    var sc = SB.dialogue.get(id);
    if (!sc) return;
    SB.speech.stopSpeaking();
    if (SB.recorder.isActive()) SB.recorder.cancel();
    state.dialogue = {
      id: id,
      index: 0,
      messages: [],
      results: [],
      phase: 'idle',
      showHint: false,
      waveLevels: [],
      ending: false,
      finished: false,
      lastResult: null,
      recordMode: 'real',
      demoNotified: false,
      recognizer: null,
      recognitionPayload: null,
      recognitionPromise: null,
      autoMetrics: null,
      totalXp: 0
    };
    pushDlgPartner();
  }

  function pushDlgPartner() {
    var d = state.dialogue, sc = dlgScenario(), turn = dlgTurn();
    if (!d || !sc || !turn) return;
    d.messages.push({ who: 'partner', en: turn.partner.en, zh: turn.partner.zh });
    // 进入新一轮时自动把对方的话念出来，模拟真实对话节奏
    setTimeout(function () {
      if (state.dialogue === d && state.route === 'dialogue-play' && d.phase === 'idle') {
        if (SB.speech.needsGesture()) { showVoiceGate(turn.partner.en, '听对方说并开启'); return; }
        speakText(turn.partner.en, 0.9, null, true);
      }
    }, 420);
  }

  function dlgComboBefore(idx) {
    var d = state.dialogue;
    var c = SB.store.comboInfo().combo;
    for (var i = 0; i < idx && i < d.results.length; i++) if (d.results[i]) c = d.results[i].combo;
    return c;
  }

  /* ---------------- 场景列表 ---------------- */
  function viewDialogueList() {
    var route = SB.store.getRoute();
    var topicIds = (route && route.topicIds) || [];
    var startStage = (route && route.startStage) || 2;
    var filter = state.dlgFilter || 'all';
    var scored = SB.dialogue.scenarios.map(function (sc) {
      var s = SB.dialogue.scoreScenario(sc, topicIds, startStage);
      return { sc: sc, s: s, rec: SB.store.dialogueRecord(sc.id) };
    });
    var filters = [
      { id: 'all', label: '全部场景' },
      { id: 'recommended', label: '为你推荐' },
      { id: '1', label: '初级' },
      { id: '2', label: '中级' },
      { id: '3', label: '高级' }
    ];
    var shown = scored.filter(function (x) {
      if (filter === 'all') return true;
      if (filter === 'recommended') return x.s.recommended;
      return String(x.sc.level) === filter;
    }).sort(function (a, b) { return b.s.score - a.s.score || a.sc.level - b.sc.level; });
    var done = SB.store.completedDialogues();
    var first = shown[0] || scored[0];

    var hero =
      '<div class="hero dlg-hero">' +
        '<div class="hero-tags"><span class="route-tagline">' + icon('chat', 13) + ' 不只是跟读 · 真实情景对话</span>' +
        '<span class="hero-level-chip untested">' + icon('sparkle', 12) + ' 从' + esc((SB.assessment.levels[startStage] || {}).short || '中级') + '起步匹配场景</span></div>' +
        '<h1>对方先开口，<br>你来把话接住。</h1>' +
        '<p>机场、咖啡店、站会、面试……扮演一个真实角色，听懂对方说什么，再自己组织一句话回应。没有标准答案，只看沟通目的有没有达成。</p>' +
        '<div class="hero-meta">' +
          '<div><b>' + SB.dialogue.scenarios.length + '</b>个真实场景</div>' +
          '<div><b>' + SB.dialogue.totalTurns + '</b>轮对话</div>' +
          '<div><b>' + done + '</b>场已完成</div>' +
        '</div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-primary btn-lg" data-action="dlg-start" data-id="' + first.sc.id + '">' + icon('mic', 17) + ' 开始对话 · ' + esc(first.sc.title) + '</button>' +
          '<button class="btn btn-outline btn-lg" data-action="nav" data-to="home">' + icon('arrowLeft', 15) + ' 回到跟读路线</button>' +
        '</div>' +
      '</div>';

    var cards = shown.map(function (x) {
      var sc = x.sc, rec = x.rec;
      return '<button class="dlg-card" data-action="dlg-start" data-id="' + sc.id + '">' +
        (x.s.recommended ? '<span class="rec-flag">为你推荐</span>' : '') +
        '<div class="dlg-card-top"><span class="dlg-card-icon" style="background:' + sc.tint + ';color:' + sc.color + '">' + icon(sc.icon, 21) + '</span>' +
        '<span class="pill ' + (sc.level === 1 ? 'mint' : sc.level === 2 ? 'brand' : 'amber') + '">' + ['初级', '中级', '高级'][sc.level - 1] + '</span></div>' +
        '<h4>' + esc(sc.title) + '</h4><div class="en">' + esc(sc.en) + '</div>' +
        '<p class="dlg-place">' + esc(sc.place) + '</p>' +
        '<div class="dlg-role"><span>你扮演 · ' + esc(sc.you) + '</span><span>对方 · ' + esc(sc.partner) + '</span></div>' +
        '<div class="dlg-card-foot"><span>' + sc.turns.length + ' 轮对话 · ' + esc(sc.goal) + '</span>' +
        (rec && rec.best ? '<span class="dlg-best">' + icon('star', 12) + ' ' + rec.best + ' 分</span>' : '<span>开始 ' + icon('arrowRight', 13) + '</span>') +
        '</div></button>';
    }).join('');

    return '<div class="dlg-list-wrap">' + hero +
      '<div class="path"><div class="section-head"><div><h2>选一个场景进入角色</h2>' +
      '<p>按你选的兴趣和定级起点排序 · 当前显示 ' + shown.length + ' / ' + scored.length + ' 场</p></div></div>' +
      '<div class="dlg-filter-row">' + filters.map(function (f) {
        return '<button class="filter-chip' + (filter === f.id ? ' on' : '') + '" data-action="dlg-filter" data-filter="' + f.id + '">' + f.label + '</button>';
      }).join('') + '</div>' +
      (cards ? '<div class="dlg-grid">' + cards + '</div>'
        : '<div class="empty"><b>这个筛选下暂时没有场景</b>换个难度或回到「全部场景」看看。</div>') +
      '</div></div>';
  }

  /* ---------------- 对话进行中 ---------------- */
  function dlgMessagesHTML(d, sc) {
    return d.messages.map(function (m) {
      if (m.who === 'partner') {
        return '<div class="bubble-row partner"><div class="bubble-avatar p">' + icon('chat', 15) + '</div><div class="bubble-col">' +
          '<div class="bubble-name">' + esc(sc.partner) + '</div>' +
          '<div class="bubble p"><div class="b-en">' + esc(m.en) + '</div><div class="b-zh">' + esc(m.zh) + '</div>' +
          '<button class="b-play" data-action="dlg-listen" data-text="' + esc(m.en) + '">' + icon('volume', 13) + ' 再听一遍</button></div></div></div>';
      }
      return '<div class="bubble-row user"><div class="bubble-col">' +
        '<div class="bubble-name right">你 · ' + esc(sc.you) + '</div>' +
        '<div class="bubble u"><div class="b-en">' + esc(m.en) + '</div>' +
        (m.zh ? '<div class="b-zh">' + esc(m.zh) + '</div>' : '') + '</div></div>' +
        '<div class="bubble-avatar u">SB</div></div>';
    }).join('');
  }

  function dlgGoalHTML(d, sc) {
    var turn = dlgTurn();
    if (!turn) return '';
    return '<div class="dlg-goal">' +
      '<div class="dlg-goal-head"><span class="dlg-turn-num">ROUND ' + pad2(d.index + 1) + ' / ' + pad2(sc.turns.length) + '</span>' +
      '<button class="route-switch" data-action="dlg-hint">' + icon(d.showHint ? 'close' : 'info', 13) + ' ' + (d.showHint ? '收起提示' : '卡住了？看提示') + '</button></div>' +
      '<div class="dlg-goal-text"><b>这一轮你要做到：</b>' + esc(turn.goal) + '</div>' +
      (d.showHint ? '<div class="dlg-hint">' + icon('sparkle', 14) + '<div>' + esc(turn.hint) + '</div></div>' : '') +
      '</div>';
  }

  function dlgFeedbackHTML(d) {
    var r = d.lastResult;
    if (!r) return '';
    if (r.noSpeech) return noSpeechHTML(r, 'dlg-retry', 'dlg-no-speech');
    var fd = r.fluencyDetail || {};
    var groups = r.groups.map(function (g) {
      return '<span class="dlg-group ' + (g.ok ? 'hit' : 'miss') + '">' + icon(g.ok ? 'check' : 'close', 11) + ' ' + esc(g.label) + '</span>';
    }).join('');
    var refs = r.reference.map(function (a) {
      return '<div class="dlg-ref"><div><b>' + esc(a.en) + '</b><span>' + esc(a.zh) + '</span></div>' +
        '<button class="icon-btn" data-action="dlg-listen" data-text="' + esc(a.en) + '" title="听这句">' + icon('volume', 14) + '</button></div>';
    }).join('');
    var comboHTML = r.combo >= 2
      ? '<div class="combo-bar">' + icon('flame', 16) + '<span>连击 <b>x' + r.combo + '</b> · XP 加成 <b>×' + r.multiplier + '</b></span></div>' : '';
    var isLast = d.index === SB.dialogue.get(d.id).turns.length - 1;
    return '<div class="dlg-feedback">' +
      '<div class="dlg-fb-head"><div class="score-ring">' + ringSVG(r.total / 100, 92, 8, scoreColor(r.total)) +
      '<div class="val"><div><b>' + r.total + '</b><span>综合得分</span></div></div></div>' +
      '<div class="dlg-score"><h3>' + (r.total >= 85 ? '接得很漂亮，对方完全听懂了' : r.total >= 70 ? '意思说到了，还能更地道一点' : '对方可能没太听明白，看看参考说法') + '</h3>' +
      '<p>沟通达成度 <b>' + r.intent + '</b> · 表达质量 <b>' + r.delivery.total + '</b> · 用时 ' + (fd.duration || 0).toFixed(1) + 's · +' + r.xp + ' XP</p>' +
      stars(r.stars, 17) + '</div></div>' +
      comboHTML +
      (r.fallback ? '<div class="route-note">' + icon('info', 14) + ' 未获取到语音识别文本，本轮按参考说法演示反馈（体验评分，XP 减半）。允许麦克风后可以直接开口说。</div>'
        : '<div class="heard-line">识别到：<b>' + esc(r.transcript) + '</b></div>') +
      '<div class="word-title">关键表达命中 <span class="legend">命中 ' + r.groups.filter(function (g) { return g.ok; }).length + ' / ' + r.groups.length + ' 组</span></div>' +
      '<div class="dlg-groups">' + groups + '</div>' +
      '<div class="word-title">还可以这样说</div><div class="dlg-refs">' + refs + '</div>' +
      '<div class="dlg-coach">' + icon('sparkle', 15) + '<div><b>表达教练</b><p>' + esc(r.coach) + '</p></div></div>' +
      '<div class="action-row">' +
      '<button class="btn btn-ghost" data-action="dlg-retry">' + icon('refresh', 15) + ' 再说一次</button>' +
      '<button class="btn btn-primary" data-action="dlg-next">' + (isLast ? '完成这场对话' : '继续对话') + ' ' + icon('arrowRight', 15) + '</button>' +
      '</div></div>';
  }

  function dlgControlsHTML(d) {
    var caps = SB.speech.capabilities();
    var demo = state.demoMode || !caps.recognition;
    return '<div class="dlg-controls" id="dlg-controls">' +
      '<div class="dlg-wave" id="dlg-wave"><canvas id="dlg-wave-canvas"></canvas><div class="wave-hint" id="dlg-wave-hint">按麦克风开始回应，这里会显示你的声音波形</div></div>' +
      '<div class="live-text" id="dlg-live"></div>' +
      '<div class="dlg-mic-row">' +
      '<div class="record-side">' + icon('headphones', 18) + '<span>听清对方的<br>问题再回答</span></div>' +
      '<button class="record-btn" id="dlg-mic" data-action="dlg-record" title="开始 / 结束回应">' + icon('mic', 32) + '</button>' +
      '<div class="record-side">' + icon('clock', 18) + '<span>最长 12 秒<br>空格键可控制</span></div></div>' +
      '<div class="record-caption" id="dlg-caption">点击麦克风，用英语回应对方</div>' +
      '<div class="dlg-control-foot"><span class="pill ' + (demo ? 'amber' : 'mint') + '">' + (demo ? '体验评分' : '真实语音识别') + '</span>' +
      '<button class="route-switch" data-action="dlg-quick">' + icon('play', 12) + ' 没有麦克风？用参考说法继续</button></div>' +
      '</div>';
  }

  function viewDialogueFinish(d) {
    var sc = SB.dialogue.get(d.id);
    var rs = d.results.filter(Boolean);
    var avg = rs.length ? Math.round(rs.reduce(function (a, b) { return a + b.total; }, 0) / rs.length) : 0;
    var starsN = SB.scoring.starsFor(avg);
    var rows = rs.map(function (r, i) {
      return '<div class="review-item"><span class="pill ' + (r.total >= 85 ? 'mint' : r.total >= 70 ? 'brand' : 'amber') + '">' + r.total + '</span>' +
        '<div class="r-en">' + esc(sc.turns[i].goal) + '</div>' + stars(r.stars, 14) + '</div>';
    }).join('');
    return '<div class="finish-wrap"><div class="card finish-card">' +
      '<div class="finish-badge">' + icon('chat', 32) + '</div>' +
      '<h1>' + (starsN === 3 ? '这场对话，说得很自然！' : starsN >= 1 ? '对话完成，继续接住下一场' : '完成对话，再来一遍会更顺') + '</h1>' +
      '<p>' + esc(sc.title) + ' · ' + esc(sc.en) + ' · ' + rs.length + ' 轮</p>' +
      '<div class="finish-score"><b>' + avg + '</b><span>平均沟通得分 / 100</span></div>' +
      '<div class="finish-stars">' + star(starsN >= 1, 30) + star(starsN >= 2, 30) + star(starsN >= 3, 30) + '</div>' +
      '<div class="finish-stats"><div class="finish-stat"><b>+' + d.totalXp + '</b><span>获得经验</span></div>' +
      '<div class="finish-stat"><b>' + rs.length + '</b><span>完成轮次</span></div>' +
      '<div class="finish-stat"><b>' + SB.store.comboInfo().combo + '</b><span>当前连击</span></div></div>' +
      '<div class="review"><h3>每轮回顾</h3>' + rows + '</div>' +
      '<div class="action-row">' +
      '<button class="btn btn-ghost" data-action="nav" data-to="dialogue">' + icon('arrowLeft', 15) + ' 换个场景</button>' +
      '<button class="btn btn-ghost" data-action="dlg-again" data-id="' + d.id + '">' + icon('refresh', 15) + ' 再聊一次</button>' +
      '<button class="btn btn-primary" data-action="nav" data-to="home">回到学习路线 ' + icon('arrowRight', 15) + '</button>' +
      '</div></div></div>';
  }

  function viewDialoguePlay() {
    var d = state.dialogue, sc = dlgScenario();
    if (!d || !sc) return '<div class="empty"><b>对话已结束</b><div style="margin-top:16px"><button class="btn btn-primary" data-action="nav" data-to="dialogue">回到场景列表</button></div></div>';
    if (d.phase === 'done') return viewDialogueFinish(d);
    var turn = dlgTurn();
    var pct = (d.index + 1) / sc.turns.length;
    return '<div class="dlg-wrap">' +
      '<div class="dlg-top">' +
      '<button class="back-btn" data-action="nav" data-to="dialogue">' + icon('arrowLeft', 15) + ' 场景列表</button>' +
      '<div class="progress-track"><span style="width:' + (pct * 100) + '%"></span></div>' +
      '<div class="progress-label">' + (d.index + 1) + ' / ' + sc.turns.length + '</div></div>' +
      '<div class="dlg-layout"><div class="dlg-stage">' +
      '<div class="dlg-scene"><div class="dlg-scene-icon" style="background:' + sc.tint + ';color:' + sc.color + '">' + icon(sc.icon, 22) + '</div>' +
      '<div><h3>' + esc(sc.title) + ' <small>' + esc(sc.en) + '</small></h3>' +
      '<p>' + esc(sc.place) + '</p>' +
      '<div class="dlg-scene-meta"><span>' + icon('mic', 12) + ' 你：' + esc(sc.you) + '</span><span>' + icon('chat', 12) + ' 对方：' + esc(sc.partner) + '</span>' +
      '<span>' + icon('target', 12) + ' ' + esc(sc.goal) + '</span></div></div></div>' +
      '<div class="dlg-chat" id="dlg-chat">' + dlgMessagesHTML(d, sc) + '</div>' +
      (d.phase === 'feedback' ? '' : dlgGoalHTML(d, sc)) +
      (d.phase === 'feedback' ? dlgFeedbackHTML(d) : dlgControlsHTML(d)) +
      '</div><div class="side-col">' +
      '<div class="card dlg-side-card"><h3>对话和跟读有什么不同</h3>' +
      '<div class="dlg-side-row"><span class="dlg-side-num">01</span><div><b>先听懂，再回应</b><p>对方的台词会自动朗读，点气泡上的喇叭可以重听。</p></div></div>' +
      '<div class="dlg-side-row"><span class="dlg-side-num">02</span><div><b>没有唯一标准答案</b><p>每轮准备了 2 种以上可接受说法，说得不一样也能拿高分。</p></div></div>' +
      '<div class="dlg-side-row"><span class="dlg-side-num">03</span><div><b>看的是「有没有说到位」</b><p>沟通达成度看关键表达是否命中，再叠加发音与流利度。</p></div></div>' +
      '</div>' +
      '<div class="card dlg-side-card"><h3>本场进度</h3>' +
      '<div class="dlg-progress-list">' + sc.turns.map(function (t, i) {
        var r = d.results[i];
        return '<div class="dlg-progress-item' + (i === d.index ? ' now' : '') + (r ? ' done' : '') + '">' +
          '<span class="dlg-progress-dot">' + (r ? icon('check', 11) : pad2(i + 1)) + '</span>' +
          '<span>' + esc(t.goal) + '</span>' + (r ? '<b>' + r.total + '</b>' : '') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="quote-card"><div class="q-label">ROLE PLAY · 角色扮演</div>' +
      '<div class="q-en">' + esc(turn ? turn.partner.en : '') + '</div>' +
      '<div class="q-zh">' + esc(turn ? turn.partner.zh : '') + '</div>' +
      (turn ? '<button class="btn btn-ghost" style="margin-top:12px;padding:8px 14px" data-action="dlg-listen" data-text="' + esc(turn.partner.en) + '">' + icon('volume', 15) + ' 听对方这句</button>' : '') +
      '</div></div></div></div>';
  }

  function updateDlgUI() {
    var d = state.dialogue;
    if (!d || state.route !== 'dialogue-play') return;
    var btn = doc.getElementById('dlg-mic');
    var controls = doc.getElementById('dlg-controls');
    var cap = doc.getElementById('dlg-caption');
    var hint = doc.getElementById('dlg-wave-hint');
    if (controls) controls.style.display = (d.phase === 'feedback' || d.phase === 'done') ? 'none' : '';
    if (!btn) return;
    btn.disabled = d.phase === 'analyzing';
    btn.classList.toggle('recording', d.phase === 'recording');
    btn.innerHTML = icon(d.phase === 'recording' ? 'stop' : 'mic', 32);
    if (d.phase === 'idle') {
      if (cap) cap.innerHTML = '点击麦克风用英语回应，或按 <b>空格键</b>';
      if (hint) { hint.classList.remove('hidden'); hint.textContent = '按麦克风开始回应，这里会显示你的声音波形'; }
    } else if (d.phase === 'recording') {
      if (cap) cap.innerHTML = '正在聆听… <b>说完点击结束</b>，或等待自动收音';
      if (hint) hint.classList.add('hidden');
    } else if (d.phase === 'analyzing') {
      if (cap) cap.textContent = '正在判断你的回应是否达成沟通目标…';
    }
  }

  function dlgDrawWave(level) {
    var d = state.dialogue;
    if (!d) return;
    d.waveLevels.push(level);
    if (d.waveLevels.length > 110) d.waveLevels.shift();
    var c = doc.getElementById('dlg-wave-canvas');
    if (!c) return;
    var dpr = global.devicePixelRatio || 1;
    var w = c.clientWidth || 600, h = c.clientHeight || 60;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    var ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var n = d.waveLevels.length, step = 6, bw = 3.6;
    var active = d.phase === 'recording';
    for (var i = 0; i < n; i++) {
      var bh = Math.max(3, d.waveLevels[i] * h * 0.9);
      var x = w - (n - i) * step;
      if (x < -bw) continue;
      ctx.fillStyle = active ? (i > n - 12 ? '#F2545B' : '#635BFF') : '#A9A2F0';
      ctx.globalAlpha = Math.max(.28, i / n);
      ctx.fillRect(x, (h - bh) / 2, bw, bh);
    }
    ctx.globalAlpha = 1;
  }

  function dlgBeginRecognition() {
    var d = state.dialogue;
    var caps = SB.speech.capabilities();
    if (!caps.recognition || state.demoMode) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var settled = false;
      var done = function (p) { if (settled) return; settled = true; resolve(p || null); };
      var ctrl = SB.speech.createRecognizer({
        onFinal: function (p) { d.recognitionPayload = p; },
        onPartial: function (txt) {
          var el = doc.getElementById('dlg-live');
          if (el) el.textContent = '实时识别：' + txt;
        },
        onError: function (err) {
          var el = doc.getElementById('dlg-live');
          if (el && (err === 'network' || err === 'not-allowed')) el.textContent = '语音识别服务不可用，本轮将按参考说法演示';
        },
        onEnd: function (p) { done(p || d.recognitionPayload); }
      });
      if (!ctrl) { done(null); return; }
      d.recognizer = ctrl;
      if (!ctrl.start()) { done(null); return; }
      setTimeout(function () { done(d.recognitionPayload); }, 12500);
    });
  }

  function startDlgRecording() {
    var d = state.dialogue;
    if (!d || d.phase !== 'idle' || d.ending) return;
    SB.speech.stopSpeaking();
    d.phase = 'recording';
    d.ending = false;
    d.waveLevels = [];
    d.recordMode = 'real';
    d.autoMetrics = null;
    d.recognitionPayload = null;
    var live = doc.getElementById('dlg-live');
    if (live) live.textContent = '';
    var caps = SB.speech.capabilities();
    d.recognitionPromise = dlgBeginRecognition();
    SB.fx.play('click');
    var turn = dlgTurn();
    SB.recorder.start({
      maxMs: 12000,
      forceDemo: state.demoMode || !caps.recognition,
      simulatedDuration: 2200 + Math.min(2600, (turn.answers[0].en.split(' ').length) * 190),
      onLevel: dlgDrawWave,
      onAutoStop: function (metrics) { d.autoMetrics = metrics; endDlgRecording(); }
    }).then(function (info) {
      d.recordMode = info.mode;
      if (info.mode === 'simulated' && !d.demoNotified) {
        d.demoNotified = true;
        toast('麦克风不可用，本轮按参考说法演示对话反馈', 'warn');
      }
    });
    updateDlgUI();
  }

  function endDlgRecording() {
    var d = state.dialogue;
    if (!d || d.phase !== 'recording' || d.ending) return;
    d.ending = true;
    d.phase = 'analyzing';
    updateDlgUI();
    if (d.recognizer) { try { d.recognizer.stop(); } catch (e) { /* noop */ } }
    var metricsP = d.autoMetrics ? Promise.resolve(d.autoMetrics) : SB.recorder.stop();
    var recP = Promise.race([
      d.recognitionPromise || Promise.resolve(null),
      new Promise(function (r) { setTimeout(function () { r(d.recognitionPayload); }, 2400); })
    ]);
    Promise.all([metricsP, recP]).then(function (arr) { evaluateDlgTurn(arr[0], arr[1]); });
  }

  function evaluateDlgTurn(metrics, rec, quickDemo) {
    var d = state.dialogue;
    if (!d || d.phase === 'done') return;
    var turn = dlgTurn();
    var transcript = rec && rec.transcript;
    var alternatives = (rec && rec.alternatives) || [];
    // 模拟录音时忽略识别器偶发返回的文本，保证体验评分判定诚实
    if (metrics && metrics.simulated) { transcript = ''; alternatives = []; }
    var result = SB.dialogue.evaluate(turn, {
      transcript: transcript,
      alternatives: alternatives,
      metrics: metrics || {},
      combo: dlgComboBefore(d.index),
      fallback: !transcript,
      allowDemo: !!state.demoMode || !!quickDemo
    });
    // 没识别到发音：不计分、不计入本场成绩，也不发奖励
    if (result.noSpeech) {
      d.results[d.index] = null;
      d.lastResult = result;
      d.phase = 'feedback';
      d.ending = false;
      renderView();
      updateDlgUI();
      return;
    }
    d.results[d.index] = result;
    d.lastResult = result;
    d.messages.push({
      who: 'user',
      en: result.transcript,
      zh: result.fallback ? '（未获取到识别文本，按参考说法演示）' : '你的回应'
    });
    d.phase = 'feedback';
    d.ending = false;
    renderView();
    updateDlgUI();
    if (result.total >= 85) { SB.fx.play('score'); SB.fx.confetti(14); }
    else SB.fx.play('star');
  }

  function dlgQuick() {
    var d = state.dialogue;
    if (!d || d.phase !== 'idle') return;
    SB.speech.stopSpeaking();
    if (SB.recorder.isActive()) SB.recorder.cancel();
    toast('本轮按参考说法演示，计为体验评分（XP 减半）', 'warn');
    evaluateDlgTurn({ duration: 2.2, avgLevel: 0.12, pauseCount: 0, pauseSeconds: 0, simulated: true, reason: '手动选择参考说法' }, null, true);
  }

  function dlgRetry() {
    var d = state.dialogue;
    if (!d || d.phase !== 'feedback') return;
    d.results[d.index] = null;
    if (d.messages.length && d.messages[d.messages.length - 1].who === 'user') d.messages.pop();
    d.lastResult = null;
    d.phase = 'idle';
    d.showHint = true;
    var live = doc.getElementById('dlg-live');
    if (live) live.textContent = '';
    renderView();
    updateDlgUI();
  }

  function dlgNext() {
    var d = state.dialogue, sc = dlgScenario();
    if (!d || !sc || d.phase !== 'feedback') return;
    if (d.index < sc.turns.length - 1) {
      d.index += 1;
      d.phase = 'idle';
      d.lastResult = null;
      d.showHint = false;
      d.waveLevels = [];
      d.autoMetrics = null;
      d.recognizer = null;
      d.recognitionPayload = null;
      d.recognitionPromise = null;
      pushDlgPartner();
      renderView();
      updateDlgUI();
      return;
    }
    finishDialogue();
  }

  function finishDialogue() {
    var d = state.dialogue, sc = dlgScenario();
    var rs = d.results.filter(Boolean);
    if (!rs.length) return;
    var avg = Math.round(rs.reduce(function (a, b) { return a + b.total; }, 0) / rs.length);
    var starsN = SB.scoring.starsFor(avg);
    var xp = 0, levelUp = 0, earned = [];
    // 对话结束时统一结算，保证「再说一次」不会重复计入 XP 与每日任务
    rs.forEach(function (r) {
      var reward = SB.store.recordSentence(r);
      xp += r.xp;
      if (reward.levelUp) levelUp = reward.level;
      earned = earned.concat(reward.achievements);
    });
    SB.store.recordDialogue(d.id, starsN, avg);
    d.totalXp = xp;
    d.phase = 'done';
    d.finished = true;
    renderView();
    renderChrome();
    if (starsN === 3) SB.fx.confetti(34);
    if (levelUp) {
      setTimeout(function () {
        SB.fx.celebrate({
          kicker: 'LEVEL UP', title: '升到 Lv.' + levelUp + '！',
          desc: '这一整场对话都是你自己一句一句接下来的。',
          reward: '本场 +' + xp + ' XP', sound: 'levelup'
        });
      }, 1000);
    } else if (earned.length) {
      toast('解锁成就 · ' + earned[0].title, 'success');
      SB.fx.play('star');
    }
  }

  /* ---------------- 首页：个性化三阶段路线 ---------------- */
  function lessonCardHTML(l, sg, recommended) {
    var unlocked = SB.store.isUnlocked(l.id);
    var s = SB.store.starsFor(l.id);
    var unit = l.unit;
    var tags = SB.route.lessonTopics[l.id] || [];
    var topic = tags.length ? SB.route.findTopic(tags[0]) : null;
    return '<button class="lesson' + (unlocked ? '' : ' locked') + '" data-action="' + (unlocked ? 'lesson' : 'locked') + '" data-id="' + l.id + '">' +
      (recommended ? '<span class="rec-flag">为你推荐</span>' : '') +
      '<div class="lesson-top"><span class="lesson-num" style="background:' + unit.tint + ';color:' + unit.color + '">' + pad2(l.index) + '</span>' +
      (unlocked ? stars(s) : '<span class="pill">' + icon('lock', 12) + ' 未解锁</span>') + '</div>' +
      '<h4>' + esc(l.title) + '</h4><div class="en">' + esc(l.en) + ' · ' + l.sentences.length + ' 句</div>' +
      '<div class="lesson-topic">' + esc(topic ? topic.label : '通用表达') + ' · ' + esc(sg.title.split(' · ')[0]) + '</div>' +
      '<div class="lesson-foot"><span class="pill mint">+' + l.xp + ' XP</span>' +
      '<span class="go">' + (s >= 1 ? '再练一次' : '开始') + ' ' + icon('arrowRight', 13) + '</span></div></button>';
  }

  function allUnitsHTML() {
    var html = '';
    SB.data.units.forEach(function (unit) {
      var done = unit.lessons.filter(function (l) { return SB.store.starsFor(l.id) >= 1; }).length;
      html += '<div class="unit"><div class="unit-head">' +
        '<div class="unit-index" style="background:' + unit.tint + ';color:' + unit.color + '">' + unit.index + '</div>' +
        '<div class="unit-head-text"><h3>' + esc(unit.title) + '</h3><p>' + esc(unit.en) + ' · ' + esc(unit.desc) + '</p></div>' +
        '<span class="unit-progress">' + done + ' / ' + unit.lessons.length + ' 关</span></div><div class="lesson-grid">';
      unit.lessons.forEach(function (l) {
        html += lessonCardHTML(l, { title: '全部课程' }, false);
      });
      html += '</div></div>';
    });
    return html;
  }

  function tasksCardHTML() {
    var tasks = SB.store.tasks();
    var done = tasks.filter(function (t) { return t.done; }).length;
    var claimed = SB.store.todayStats().chestClaimed;
    var ready = SB.store.chestAvailable();
    var items = tasks.map(function (t) {
      return '<div class="task-item' + (t.done ? ' done' : '') + '">' +
        '<div class="task-icon">' + icon(t.done ? 'check' : t.icon, 15) + '</div>' +
        '<div class="task-body"><div class="t-title">' + esc(t.title) + '</div><div class="t-sub">' + esc(t.desc) + '</div></div>' +
        '<div class="task-progress">' + (t.done ? '完成' : t.progress + ' / ' + t.target + (t.unit || '')) + '</div></div>';
    }).join('');
    var chest;
    if (claimed) {
      chest = '<div class="chest"><div class="c-icon">' + icon('checkCircle', 22) + '</div><div class="c-title">今日宝箱已开启</div><div class="c-sub">明天再来，还有新的奖励</div></div>';
    } else if (ready) {
      chest = '<div class="chest ready"><div class="c-icon">' + icon('gift', 22) + '</div><div class="c-title">每日宝箱已解锁</div>' +
        '<div class="c-sub">三件小任务全部完成，打开看看今天的手气</div>' +
        '<button class="btn btn-primary" data-action="claim-chest">开启宝箱</button></div>';
    } else {
      chest = '<div class="chest"><div class="c-icon">' + icon('gift', 22) + '</div><div class="c-title">每日宝箱</div>' +
        '<div class="c-sub">完成上面 3 个任务后可开启（' + done + '/3）</div></div>';
    }
    return '<div class="card task-card"><h3>今日任务</h3><div class="sub">小目标一个个点亮，全部完成有惊喜</div>' + items + chest + '</div>';
  }

  function dialogueCardHTML() {
    var done = SB.store.completedDialogues();
    var route = SB.store.getRoute();
    var topicIds = (route && route.topicIds) || [];
    var startStage = (route && route.startStage) || 2;
    var best = SB.dialogue.scenarios.map(function (sc) {
      return { sc: sc, s: SB.dialogue.scoreScenario(sc, topicIds, startStage) };
    }).sort(function (a, b) { return b.s.score - a.s.score; })[0];
    return '<div class="card dlg-entry-card"><div class="i-head"><h3>换个方式练</h3>' +
      '<span class="pill violet">NEW</span></div>' +
      '<div class="dlg-entry-title">' + icon('chat', 18) + ' 情景对话</div>' +
      '<p>跟读练发音，对话练把话说出去。' + SB.dialogue.scenarios.length + ' 个真实场景、' + SB.dialogue.totalTurns + ' 轮角色扮演，说完看「沟通达成度」。</p>' +
      '<div class="dlg-entry-meta">已完成 <b>' + done + '</b> 场 · 推荐 <b>' + esc(best.sc.title) + '</b></div>' +
      '<button class="btn btn-soft" data-action="dlg-start" data-id="' + best.sc.id + '">' + icon('play', 13) + ' 进入情景对话</button></div>';
  }

  function interestCardHTML(r) {
    return '<div class="card interest-card"><div class="i-head"><h3>我的兴趣</h3>' +
      '<button class="route-switch" data-action="edit-interests">' + icon('settings', 13) + ' 调整</button></div>' +
      '<div class="interest-tags">' + (r.labels && r.labels.length
        ? r.labels.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('')
        : '<span>通用路线</span>') + '</div></div>';
  }

  /** 侧栏「我的水平」：把定级结论、路线起点和重测入口显式呈现出来。 */
  function myLevelCardHTML(p) {
    var head = '<div class="l-head"><h3>我的水平</h3>' +
      (p ? '<button class="route-switch" data-action="start-retest">' + icon('refresh', 13) + ' 重新测评</button>' : '') +
      '</div>';
    if (!p) {
      return '<div class="card my-level-card untested">' + head +
        '<div class="l-badge"><b>未测评</b><span>DEFAULT · B1</span></div>' +
        '<p class="l-empty">你跳过了定级测评，当前按 <b>中级</b> 起步排路线。做一次约 1 分钟的测评，我们会把起点调到真正适合你的难度，低级别阶段自动变成可选热身。</p>' +
        '<button class="btn btn-soft" data-action="start-retest">' + icon('target', 14) + ' 去做定级测评</button>' +
        '</div>';
    }
    var d = new Date(p.date || Date.now());
    var dateText = d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
    return '<div class="card my-level-card" style="--lv:' + esc(p.color) + ';--lv-tint:' + esc(p.tint) + '">' + head +
      '<div class="l-badge"><b>' + esc(p.label) + '</b><span>' + esc(p.en) + '</span></div>' +
      '<div class="l-metrics"><div><b>' + p.score + '</b><span>定级得分</span></div>' +
      '<div><b>' + p.speaking + '</b><span>跟读发音</span></div>' +
      '<div><b>' + p.choice + '%</b><span>理解正确率</span></div></div>' +
      '<p>' + esc(p.advice) + '</p>' +
      (p.demo ? '<div class="l-note">' + icon('info', 12) + ' 跟读为体验评分，已主要按理解题定级' + (p.capped ? '并保守封顶中级' : '') + '。允许麦克风后重测会更准。</div>' : '') +
      '<div class="l-date">测于 ' + dateText + ' · 路线起点：' + esc(p.short) + '段</div>' +
      '</div>';
  }

  function viewHome() {
    var r = SB.store.getRoute();
    var st = SB.store.get();
    var next = SB.store.nextPlayableLesson();
    var today = SB.store.todayStats();
    var goal = SB.data.dailyGoal;
    var pct = Math.min(1, today.sentences / goal.sentences);
    var quote = dailySentence();
    var combo = SB.store.comboInfo();
    var placement = SB.store.getPlacement();
    var startMeta = SB.assessment.levels[r.startStage] || SB.assessment.levels[2];

    var hero =
      '<div class="hero">' +
        '<div class="hero-tags">' +
          '<span class="route-tagline">' + icon('sparkle', 13) + ' 为你定制 · ' + esc(SB.route.title(r)) + '</span>' +
          (placement
            ? '<span class="hero-level-chip" style="background:' + esc(placement.color) + '">' + icon('target', 12) + ' ' + esc(placement.label) + ' · 从' + esc(placement.short) + '起步</span>'
            : '<span class="hero-level-chip untested">' + icon('info', 12) + ' 未测评 · 默认' + esc(startMeta.short) + '起步</span>') +
        '</div>' +
        '<h1>' + (placement
          ? '你的水平，我们测过了。<br>路线从' + esc(placement.short) + '开始。'
          : '你选的方向，<br>我们排好了路。') + '</h1>' +
        '<p>' + (placement
          ? '结合 ' + placement.score + ' 分定级和你选的兴趣，把最该练的关卡排进主线；' + esc(placement.short) + '之前的阶段全部开放为可选热身，不用从零刷起。'
          : '从高频短句到专业表达，三段递进。每读一句都有逐词反馈，连着读好还能攒连击加成。') + '</p>' +
        '<div class="route-interests">' + (r.labels || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
        '<div class="hero-meta">' +
          '<div><b>' + esc(startMeta.short) + '</b>定级起点</div>' +
          '<div><b>' + r.order.length + '</b>关专属路线</div>' +
          '<div><b>' + (combo.best || 0) + '</b>最高连击</div>' +
        '</div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-primary btn-lg" data-action="lesson" data-id="' + next.id + '">' + icon('mic', 17) + ' 继续闯关 · ' + esc(next.title) + '</button>' +
          '<button class="btn btn-outline btn-lg" data-action="nav" data-to="dialogue">' + icon('chat', 16) + ' 练情景对话</button>' +
          '<button class="btn btn-outline btn-lg" data-action="edit-interests">调整兴趣</button>' +
        '</div>' +
      '</div>';

    var note = (r.unmatched && r.unmatched.length)
      ? '<div class="route-note">' + icon('info', 14) + ' 「' + esc(r.unmatched.join('」「')) + '」暂时还没有专属课程，已先用同难度的高频通用表达打底，路线里标「为你推荐」的才是和你选的话题直接相关的关卡。</div>'
      : '';
    if (!placement) {
      note += '<div class="route-note">' + icon('info', 14) + ' 还没做定级测评，当前默认从' + esc(startMeta.short) + '起步。测评后，起点之前的阶段会自动变成「可选热身」——全部开放、不占主线进度。</div>';
    }

    var stages = r.stages.map(function (sg) {
      var done = sg.lessons.filter(function (id) { return SB.store.starsFor(id) >= 1; }).length;
      var sp = sg.total ? done / sg.total : 0;
      var statusCls = sg.status || 'future';
      var statusLabel = sg.status === 'warmup' ? '可选热身 · 全部开放'
        : sg.status === 'current' ? '你的起点 · 从这里开始'
        : '进阶目标 · 通关解锁';
      var cards = sg.lessons.map(function (id) {
        var l = SB.data.getLesson(id);
        return l ? lessonCardHTML(l, sg, sg.recommended.indexOf(id) !== -1) : '';
      }).join('');
      return '<div class="stage-block' + (sg.optional ? ' is-warmup' : '') + '"><div class="stage-head">' +
        '<div class="stage-num" style="background:' + sg.tint + ';color:' + sg.color + '">' + icon(sg.icon, 22) + '</div>' +
        '<div class="stage-head-text"><h3>' + esc(sg.title) + '</h3>' +
        '<span class="stage-status ' + statusCls + '">' + statusLabel + '</span>' +
        '<p>' + esc(sg.desc) + '</p>' +
        '<div class="stage-bar"><span style="width:' + (sp * 100) + '%;background:' + sg.color + '"></span></div></div>' +
        '<div class="stage-meter"><b>' + done + '/' + sg.total + '</b><span>关已通关</span></div></div>' +
        '<div class="stage-lessons">' + cards + '</div></div>';
    }).join('');

    var allBlock = state.showAll
      ? '<div class="path">' + allUnitsHTML() + '</div>'
      : '';

    var path =
      '<div class="path"><div class="section-head"><div><h2>' + (state.showAll ? '全部课程' : '我的学习路线') + '</h2>' +
      '<p>' + (state.showAll
        ? SB.data.units.length + ' 个单元 · ' + SB.data.lessons.length + ' 个关卡 · ' + SB.data.totalSentences + ' 个跟读句子'
        : '按兴趣匹配 + 定级起点排序 · 主线 ' + r.order.length + ' 关 · 可选热身 ' + r.warmupIds.length + ' 关 · 通关一关解锁下一关') + '</p></div>' +
      '<button class="route-switch" data-action="toggle-all">' + icon(state.showAll ? 'arrowLeft' : 'book', 13) + ' ' + (state.showAll ? '回到我的路线' : '查看全部 ' + SB.data.lessons.length + ' 关') + '</button></div>' +
      note + (state.showAll ? allBlock : stages) + '</div>';

    var todayCard =
      '<div class="card today-card"><h3>今日目标</h3><div class="sub">每天一点点，比偶尔猛练更有效</div>' +
      '<div class="ring-wrap"><div class="ring">' + ringSVG(pct, 104, 9, '#635BFF') +
      '<div class="ring-center"><div><b>' + Math.round(pct * 100) + '%</b><span>已完成</span></div></div></div>' +
      '<div><div style="font-size:13px;font-weight:800">还差 ' + Math.max(0, goal.sentences - today.sentences) + ' 句</div>' +
      '<div style="font-size:11px;color:var(--ink-4);margin-top:4px;line-height:1.6">今日获得 ' + today.xp + ' XP<br>连续打卡 ' + (st.streak || 0) + ' 天</div></div></div>' +
      '<div class="goal-list">' +
      '<div class="goal-item"><span class="check' + (today.sentences >= goal.sentences ? '' : ' pending') + '">' + icon(today.sentences >= goal.sentences ? 'check' : 'clock', 12) + '</span>跟读 <b>' + goal.sentences + '</b> 个句子</div>' +
      '<div class="goal-item"><span class="check' + (today.seconds >= goal.minutes * 60 ? '' : ' pending') + '">' + icon(today.seconds >= goal.minutes * 60 ? 'check' : 'clock', 12) + '</span>开口 <b>' + goal.minutes + '</b> 分钟</div>' +
      '</div></div>';

    var quoteCard =
      '<div class="quote-card"><div class="q-label">DAILY SENTENCE · 每日一句</div>' +
      '<div class="q-en">' + esc(quote.en) + '</div><div class="q-zh">' + esc(quote.zh) + '</div>' +
      '<button class="btn btn-ghost" style="margin-top:12px;padding:8px 14px" data-action="speak-text" data-text="' + esc(quote.en) + '" data-rate="0.9">' + icon('volume', 15) + ' 听这句发音</button></div>';

    return '<div class="home-grid"><div>' + hero + path + '</div>' +
      '<div class="side-col">' + myLevelCardHTML(placement) + todayCard + dialogueCardHTML() + tasksCardHTML() + interestCardHTML(r) + quoteCard + '</div></div>';
  }

  /* ---------------- 练习页 ---------------- */
  function viewPractice() {
    var c = current(), lesson = c.lesson, s = c.s;
    var pct = (state.session.index + 1) / lesson.sentences.length;
    var caps = SB.speech.capabilities();
    var combo = SB.store.comboInfo();
    var badge = state.demoMode || !caps.recognition
      ? '<span class="pill amber" id="mode-badge">体验评分</span>'
      : '<span class="pill mint" id="mode-badge">真实语音识别</span>';
    var comboBadge = combo.combo >= 2
      ? '<span class="combo-badge">' + icon('flame', 13) + ' 连击 x' + combo.combo + ' · XP ×' + combo.multiplier + '</span>'
      : '';

    return '<div class="practice-wrap">' +
      '<div class="practice-top">' +
      '<button class="back-btn" data-action="nav" data-to="home">' + icon('arrowLeft', 15) + ' 返回路线</button>' +
      '<div class="progress-track"><span style="width:' + (pct * 100) + '%"></span></div>' +
      '<div class="progress-label">' + (state.session.index + 1) + ' / ' + lesson.sentences.length + '</div></div>' +
      '<div class="card practice-card" id="practice-card">' +
      '<div class="practice-head"><div class="topic">UNIT ' + lesson.unit.index + ' · ' + esc(lesson.title) + ' <span>/ 第 ' + (state.session.index + 1) + ' 句</span></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' + comboBadge + badge + '</div></div>' +
      '<div class="sentence">' +
      '<p class="en">' + esc(s.en) + '</p>' +
      '<div class="ipa"><b>' + esc(s.ipa) + '</b> &nbsp;' + esc(s.key) + ' · 发音重点</div>' +
      '<div class="zh">' + esc(s.zh) + '</div>' +
      '<div class="sentence-tools">' +
      '<button class="btn btn-ghost" data-action="speak-text" data-text="' + esc(s.en) + '" data-rate="0.92">' + icon('volume', 15) + ' 听标准发音</button>' +
      '<button class="btn btn-soft" data-action="speak-text" data-text="' + esc(s.en) + '" data-rate="0.62">' + icon('play', 13) + ' 慢速 0.6x</button>' +
      '</div></div>' +
      '<div class="tip-inline">' + icon('info', 15) + '<div><b>发音提示：</b>' + esc(s.tip) + '</div></div>' +
      '<div class="wave-area" id="wave-area"><canvas id="wave-canvas"></canvas><div class="wave-hint" id="wave-hint">点击麦克风开始跟读，这里会显示你的声音波形</div></div>' +
      '<div class="live-text" id="live-text"></div>' +
      '<div class="record-row" id="record-row">' +
      '<div class="record-side">' + icon('headphones', 18) + '<span>先听再读<br>效果更好</span></div>' +
      '<button class="record-btn" id="record-btn" data-action="record" title="开始 / 结束录音">' + icon('mic', 34) + '</button>' +
      '<div class="record-side">' + icon('clock', 18) + '<span>最长 12 秒<br>空格键可控制</span></div></div>' +
      '<div class="record-caption" id="record-caption">点击麦克风开始跟读</div>' +
      '<div id="feedback-slot"></div>' +
      '</div></div>';
  }

  function updatePracticeUI() {
    if (state.route !== 'practice') return;
    var btn = doc.getElementById('record-btn');
    if (!btn) return;
    var cap = doc.getElementById('record-caption');
    var hint = doc.getElementById('wave-hint');
    var wave = doc.getElementById('wave-area');
    var row = doc.getElementById('record-row');
    var badge = doc.getElementById('mode-badge');
    var showingResult = state.phase === 'result';
    if (wave) wave.style.display = showingResult ? 'none' : '';
    if (row) row.style.display = showingResult ? 'none' : '';
    if (cap) cap.style.display = showingResult ? 'none' : '';
    btn.disabled = state.phase === 'analyzing';
    btn.classList.toggle('recording', state.phase === 'recording');
    btn.innerHTML = icon(state.phase === 'recording' ? 'stop' : 'mic', 34);
    if (state.phase === 'idle') {
      if (cap) cap.innerHTML = '点击麦克风开始跟读，或按 <b>空格键</b>';
      if (hint) { hint.classList.remove('hidden'); hint.textContent = '点击麦克风开始跟读，这里会显示你的声音波形'; }
    } else if (state.phase === 'recording') {
      if (cap) cap.innerHTML = '正在聆听… <b>读完点击结束</b>，或等待自动收音';
      if (hint) hint.classList.add('hidden');
    } else if (state.phase === 'analyzing') {
      if (cap) cap.textContent = '正在分析你的发音…';
    }
    if (badge) {
      var demo = state.demoMode || !SB.speech.capabilities().recognition || state.recordMode === 'simulated';
      badge.className = 'pill ' + (demo ? 'amber' : 'mint');
      badge.textContent = demo ? '体验评分' : '真实语音识别';
    }
  }

  function drawWave(level) {
    state.waveLevels.push(level);
    if (state.waveLevels.length > 110) state.waveLevels.shift();
    var c = doc.getElementById('wave-canvas');
    if (!c) return;
    var dpr = global.devicePixelRatio || 1;
    var w = c.clientWidth || 600, h = c.clientHeight || 60;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    var ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var n = state.waveLevels.length, step = 6, bw = 3.6;
    var active = state.phase === 'recording';
    for (var i = 0; i < n; i++) {
      var lv = state.waveLevels[i];
      var bh = Math.max(3, lv * h * 0.9);
      var x = w - (n - i) * step;
      if (x < -bw) continue;
      ctx.fillStyle = active ? (i > n - 12 ? '#F2545B' : '#635BFF') : '#A9A2F0';
      ctx.globalAlpha = Math.max(.28, i / n);
      ctx.fillRect(x, (h - bh) / 2, bw, bh);
    }
    ctx.globalAlpha = 1;
  }

  function beginRecognition() {
    var caps = SB.speech.capabilities();
    if (!caps.recognition || state.demoMode) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var settled = false;
      var done = function (payload) { if (settled) return; settled = true; resolve(payload || null); };
      var ctrl = SB.speech.createRecognizer({
        onFinal: function (p) { state.recognitionPayload = p; },
        onPartial: function (txt) {
          var el = doc.getElementById('live-text');
          if (el) el.textContent = '实时识别：' + txt;
        },
        onError: function (err) {
          state.recognitionError = err;
          var el = doc.getElementById('live-text');
          if (el && (err === 'network' || err === 'not-allowed')) el.textContent = '语音识别服务不可用，将使用体验评分';
        },
        onEnd: function (p) { done(p || state.recognitionPayload); }
      });
      if (!ctrl) { done(null); return; }
      state.recognizer = ctrl;
      if (!ctrl.start()) { done(null); return; }
      setTimeout(function () { done(state.recognitionPayload); }, 12500);
    });
  }

  function startRecording() {
    if (state.phase === 'recording' || state.phase === 'analyzing') return;
    SB.speech.stopSpeaking();
    clearSentence();
    var s = current().s;
    state.phase = 'recording';
    state.waveLevels = [];
    state.recordMode = 'real';
    var caps = SB.speech.capabilities();
    state.recognitionPromise = beginRecognition();
    SB.fx.play('click');

    SB.recorder.start({
      maxMs: 12000,
      forceDemo: state.demoMode || !caps.recognition,
      simulatedDuration: 2100 + Math.min(2400, s.en.split(' ').length * 230),
      onLevel: drawWave,
      onAutoStop: function (metrics) { state.autoMetrics = metrics; endRecording(); }
    }).then(function (info) {
      state.recordMode = info.mode;
      updatePracticeUI();
      if (info.mode === 'simulated') toast(info.reason + ' · 已进入体验评分', 'warn');
    });
    updatePracticeUI();
  }

  function endRecording() {
    if (state.phase !== 'recording' || state.ending) return;
    state.ending = true;
    state.phase = 'analyzing';
    updatePracticeUI();
    if (state.recognizer) { try { state.recognizer.stop(); } catch (e) { /* noop */ } }
    var slot = doc.getElementById('feedback-slot');
    if (slot) slot.innerHTML = '<div class="analysis"><span class="spinner"></span> 正在比对发音、语速和停顿…</div>';

    var metricsP = state.autoMetrics ? Promise.resolve(state.autoMetrics) : SB.recorder.stop();
    var recP = Promise.race([
      state.recognitionPromise || Promise.resolve(null),
      new Promise(function (r) { setTimeout(function () { r(state.recognitionPayload); }, 2400); })
    ]);

    Promise.all([metricsP, recP]).then(function (arr) {
      var metrics = arr[0], rec = arr[1];
      var s = current().s;
      var combo = SB.store.comboInfo();
      var result = SB.scoring.score({
        sentence: s,
        transcript: rec && rec.transcript,
        alternatives: rec && rec.alternatives,
        metrics: metrics,
        combo: combo.combo,
        allowDemo: !!state.demoMode
      });
      // 没识别到发音：不计分、不入账、不发奖励，只引导重新录一次
      if (result.noSpeech) {
        state.lastResult = result;
        state.phase = 'result';
        state.ending = false;
        renderFeedback(result);
        updatePracticeUI();
        return;
      }
      var reward = SB.store.recordSentence(result);
      state.lastResult = result;
      state.phase = 'result';
      state.ending = false;
      renderFeedback(result);
      updatePracticeUI();
      renderChrome();

      /* 即时反馈：音效 + 彩带 + 升级 / 成就庆祝 */
      if (result.total >= 88) { SB.fx.play('score'); SB.fx.confetti(16); }
      else if (result.combo >= 2) SB.fx.play('combo');
      else SB.fx.play('star');

      if (reward.levelUp) {
        setTimeout(function () {
          SB.fx.celebrate({
            kicker: 'LEVEL UP', title: '升到 Lv.' + reward.level + '！',
            desc: '刚才那句把经验条顶满了。保持这个节奏，下一段路线马上解锁。',
            reward: '当前 ' + SB.store.get().xp + ' XP', sound: 'levelup'
          });
        }, 1400);
      } else if (reward.achievements.length) {
        setTimeout(function () {
          toast('解锁成就 · ' + reward.achievements[0].title + '，' + reward.achievements[0].desc, 'success');
          SB.fx.play('star');
        }, 700);
      } else if (reward.chestReady) {
        setTimeout(function () { toast('今日任务全部完成，宝箱已解锁！', 'success'); }, 800);
      }
    });
  }

  function scoreHeadline(t) {
    if (t >= 90) return '漂亮！几乎是母语节奏';
    if (t >= 80) return '很棒，读得挺地道';
    if (t >= 70) return '不错，再打磨一下细节';
    if (t >= 55) return '继续练，先抓住重点音';
    return '别急，先听一遍再跟读';
  }

  function noSpeechReasonText(reason) {
    if (reason === 'recorder-unavailable') return '麦克风或浏览器语音识别不可用，这次没有采集到你的发音。';
    if (reason === 'silence') return '录音里几乎听不到声音，可能是离麦克风太远、音量太小或被静音了。';
    return '这次没有识别到英文发音（没开口、说得太轻，或语音识别服务没有返回结果）。';
  }
  /** 不说话就绝不给分：0 分、0 XP、0 星，并给出重新录音 / 体验模式两个出口。 */
  function noSpeechHTML(result, retryAction, extraClass) {
    return '<div class="no-speech ' + (extraClass || '') + '">' +
      '<div class="no-speech-icon">' + icon('mic', 22) + '</div>' +
      '<div class="no-speech-body"><h3>没有听到你的声音，本次不计分</h3>' +
      '<p>' + esc(noSpeechReasonText(result.noSpeechReason)) + ' 本次不会获得分数、星星、连击和 XP。</p>' +
      '<p class="no-speech-hint">请用正常音量把句子读完再点结束；若浏览器不支持语音识别，可开启「体验模式」用模拟评分体验完整流程。</p></div>' +
      '<div class="action-row">' +
      '<button class="btn btn-primary" data-action="' + retryAction + '">' + icon('refresh', 15) + ' 重新录音</button>' +
      (state.demoMode ? '' : '<button class="btn btn-ghost" data-action="enable-demo">' + icon('play', 14) + ' 开启体验模式</button>') +
      '</div></div>';
  }

  function renderFeedback(result) {
    var slot = doc.getElementById('feedback-slot');
    if (!slot) return;
    if (result.noSpeech) { slot.innerHTML = noSpeechHTML(result, 'retry'); return; }
    var d = result.fluencyDetail || {};
    var metrics = [
      { label: '准确度', v: Math.round(result.accuracy * 100), cls: '' },
      { label: '流利度', v: Math.round(result.fluency * 100), cls: 'green' },
      { label: '完整度', v: Math.round(result.completeness * 100), cls: 'amber' }
    ];
    var chips = result.words.map(function (w, i) {
      var sub = w.status === 'near' && w.heard ? '听作 ' + w.heard : w.status === 'wrong' && w.heard ? '听作 ' + w.heard : w.status === 'missing' ? '漏读' : '';
      return '<button class="word-chip ' + w.status + '" style="animation-delay:' + (i * 45) + 'ms" data-action="speak-word" data-word="' + esc(w.text) + '" title="点击听这个词的发音">' + esc(w.text) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>';
    }).join('');
    var diagnose = result.diagnose.map(function (t) {
      var ic = t.tone === 'warn' ? 'alert' : t.tone === 'good' ? 'checkCircle' : 'info';
      return '<div class="diagnose ' + t.tone + '"><div class="d-icon">' + icon(ic, 15) + '</div><div><h5>' + esc(t.label) + '</h5><p>' + esc(t.advice) + '</p></div></div>';
    }).join('');
    var heardLine = result.transcript
      ? '<div class="heard-line">识别到：<b>' + esc(result.transcript) + '</b></div>'
      : '<div class="heard-line">未获取到语音识别文本，本次为<b>体验评分</b>（' + esc(result.metrics && result.metrics.reason || '浏览器限制') + '）</div>';

    var comboHTML = '';
    if (result.combo >= 2) {
      comboHTML = '<div class="combo-bar">' + icon('flame', 16) + '<span>连击 <b>x' + result.combo + '</b> · XP 加成 <b>×' + result.multiplier + '</b>，多拿 ' + result.comboBonus + ' XP</span>' +
        '<span class="cb-track"><span style="width:' + Math.min(100, result.combo / 5 * 100) + '%"></span></span></div>';
    } else if (result.combo === 1) {
      comboHTML = '<div class="combo-bar">' + icon('flame', 16) + '<span>开个好头！<b>再来一句 80+</b> 就能触发连击加成</span></div>';
    }

    slot.innerHTML = '<div class="feedback">' +
      '<div class="feedback-head">' +
      '<div class="score-ring">' + ringSVG(result.total / 100, 96, 8, scoreColor(result.total)) +
      '<div class="val"><div><b id="score-number">0</b><span>总分 / 100</span></div></div></div>' +
      '<div class="score-summary"><h3>' + scoreHeadline(result.total) + '</h3>' +
      '<p>用时 ' + (d.duration || 0).toFixed(1) + 's · 约 ' + (d.wpm || 0) + ' WPM · 停顿 ' + (d.pauses || 0) + ' 次 · +' + result.xp + ' XP</p>' +
      stars(result.stars, 18) + '</div>' +
      '<div class="metric-grid">' + metrics.map(function (m) {
        return '<div class="metric ' + m.cls + '"><div class="m-top"><span>' + m.label + '</span><b>' + m.v + '</b></div><div class="m-track"><span style="width:' + m.v + '%"></span></div></div>';
      }).join('') + '</div></div>' +
      comboHTML +
      '<div class="word-title">逐词发音 <span class="legend"><span><i style="background:#BFEBDD"></i>准确</span><span><i style="background:#F9DEB0"></i>接近</span><span><i style="background:#F8CBD0"></i>需纠正</span><span><i style="background:#E3E5EE"></i>漏读</span></span></div>' +
      '<div class="word-row">' + chips + '</div>' + heardLine +
      '<div class="diagnose-grid">' + diagnose + '</div>' +
      '<div class="action-row">' +
      '<button class="btn btn-ghost" data-action="retry">' + icon('refresh', 15) + ' 再录一次</button>' +
      (result.metrics && result.metrics.url ? '<button class="btn btn-ghost" data-action="listen-self">' + icon('headphones', 15) + ' 听我的录音</button>' : '') +
      '<button class="btn btn-primary" data-action="next">' + (state.session.index === current().lesson.sentences.length - 1 ? '完成本关' : '下一句') + ' ' + icon('arrowRight', 15) + '</button>' +
      '</div></div>';
    SB.fx.countUp(doc.getElementById('score-number'), result.total, 750);
  }

  function nextSentence() {
    var r = state.lastResult;
    if (!r) return;
    if (!r.consumed) { state.session.results.push(r); r.consumed = true; }
    var lesson = current().lesson;
    if (state.session.index < lesson.sentences.length - 1) {
      state.session.index++;
      clearSentence();
      renderView();
    } else finishLesson();
  }

  function finishLesson() {
    var lesson = current().lesson;
    var rs = state.session.results.slice();
    if (!rs.length) { go('#/home'); return; }
    var avg = Math.round(rs.reduce(function (a, b) { return a + b.total; }, 0) / rs.length);
    var starsN = SB.scoring.starsFor(avg);
    SB.store.recordLesson(lesson.id, starsN, avg);
    state.finishData = {
      lessonId: lesson.id, lessonTitle: lesson.title, unitTitle: lesson.unit.title,
      avg: avg, starsN: starsN,
      xp: rs.reduce(function (a, b) { return a + b.xp; }, 0),
      seconds: Math.round(rs.reduce(function (a, b) { return a + ((b.metrics && b.metrics.duration) || 0); }, 0)),
      review: rs.map(function (r) { return { en: r.sentence.en, total: r.total, stars: r.stars, demo: r.demo }; })
    };
    saveFinish(state.finishData);
    state.session.finished = true;
    go('#/finish/' + lesson.id);
    if (starsN === 3) setTimeout(function () { SB.fx.confetti(34); }, 350);
  }

  /* ---------------- 结算页 ---------------- */
  function viewFinish() {
    var f = state.finishData || loadFinish();
    if (!f) return '<div class="empty"><b>还没有练习记录</b>先去完成一关，再回来看成绩吧。<div style="margin-top:16px"><button class="btn btn-primary" data-action="nav" data-to="home">回到学习路线</button></div></div>';
    var next = nextInRoute(f.lessonId);
    var review = f.review.map(function (r) {
      return '<div class="review-item"><span class="pill ' + (r.total >= 85 ? 'mint' : r.total >= 70 ? 'brand' : 'amber') + '">' + r.total + '</span>' +
        '<div class="r-en">' + esc(r.en) + '</div>' + stars(r.stars, 14) +
        '<button class="icon-btn" data-action="speak-text" data-text="' + esc(r.en) + '" data-rate="0.9" title="再听一遍">' + icon('volume', 14) + '</button></div>';
    }).join('');
    return '<div class="finish-wrap"><div class="card finish-card">' +
      '<div class="finish-badge">' + icon('trophy', 34) + '</div>' +
      '<h1>' + (f.starsN === 3 ? '这一关，拿下了！' : f.starsN >= 1 ? '通关成功，继续加油' : '完成练习，再来一遍会更好') + '</h1>' +
      '<p>' + esc(f.unitTitle) + ' · ' + esc(f.lessonTitle) + '</p>' +
      '<div class="finish-score"><b>' + f.avg + '</b><span>平均得分 / 100</span></div>' +
      '<div class="finish-stars">' + star(f.starsN >= 1, 30) + star(f.starsN >= 2, 30) + star(f.starsN >= 3, 30) + '</div>' +
      '<div class="finish-stats">' +
      '<div class="finish-stat"><b>+' + f.xp + '</b><span>获得经验</span></div>' +
      '<div class="finish-stat"><b>' + f.seconds + 's</b><span>开口时长</span></div>' +
      '<div class="finish-stat"><b>' + f.review.length + '</b><span>完成句子</span></div></div>' +
      '<div class="review"><h3>本关回顾</h3>' + review + '</div>' +
      '<div class="action-row">' +
      '<button class="btn btn-ghost" data-action="nav" data-to="home">返回路线</button>' +
      '<button class="btn btn-ghost" data-action="restart" data-id="' + f.lessonId + '">' + icon('refresh', 15) + ' 再练一次</button>' +
      (next ? '<button class="btn btn-primary" data-action="lesson" data-id="' + next.id + '">下一关 · ' + esc(next.title) + ' ' + icon('arrowRight', 15) + '</button>'
        : '<button class="btn btn-primary" data-action="nav" data-to="stats">查看学习统计</button>') +
      '</div></div></div>';
  }

  /* ---------------- 统计页 ---------------- */
  function viewStats() {
    var st = SB.store.get();
    var lvl = SB.store.level();
    var week = SB.store.last7();
    var max = Math.max(3, week.reduce(function (a, b) { return Math.max(a, b.data.sentences); }, 0));
    var weak = SB.store.weakList();
    var minutes = Math.round(st.totalSeconds / 60);
    var combo = SB.store.comboInfo();
    var pl = SB.store.getPlacement();
    var placeLine = pl
      ? '定级 ' + esc(pl.label) + '（' + pl.score + ' 分） · 主线从' + esc(pl.short) + '起步。'
      : '尚未定级测评 · 当前默认从中级起步，可在首页「我的水平」补测。';
    var cards = [
      { label: '累计经验', icon: 'bolt', val: st.xp, sub: 'Lv.' + lvl.level + ' · 距下一级 ' + (lvl.target - lvl.current) + ' XP' },
      { label: '开口次数', icon: 'book', val: st.totalSentences, sub: '跟读 ' + SB.data.totalSentences + ' 句课程 · 已通关 ' + SB.store.completedLessons() + ' 关' },
      { label: '情景对话', icon: 'chat', val: SB.store.completedDialogues() + ' 场', sub: '共 ' + SB.dialogue.scenarios.length + ' 个场景 · ' + SB.dialogue.totalTurns + ' 轮角色扮演' },
      { label: '最高连击', icon: 'flame', val: 'x' + (combo.best || 0), sub: '当前连击 x' + combo.combo + ' · 连续 80 分以上触发加成' },
      { label: '连续打卡', icon: 'calendar', val: (st.streak || 0) + ' 天', sub: '最高单句 ' + (st.maxScore || 0) + ' 分' }
    ];
    var chartBars = week.map(function (d) {
      var h = d.data.sentences ? Math.max(6, d.data.sentences / max * 150) : 4;
      return '<div class="chart-col"><div class="chart-bar' + (d.data.sentences ? '' : ' empty') + '" style="height:' + h + 'px">' +
        (d.data.sentences ? '<span class="bubble">' + d.data.sentences + ' 句</span>' : '') + '</div></div>';
    }).join('');
    var chartLabels = week.map(function (d) { return '<span class="' + (d.isToday ? 'today' : '') + '">' + (d.isToday ? '今天' : '周' + d.label) + '</span>'; }).join('');
    var weakHTML = weak.length ? weak.map(function (w) {
      return '<div class="weak-item"><div class="w-top">' + esc(w.label) + '<span>出现 ' + w.count + ' 次</span></div><p>' + esc(w.advice) + '</p></div>';
    }).join('') : '<div class="empty"><b>暂时没有明显薄弱音</b>多练几句，系统会帮你找出需要注意的发音。</div>';
    return '<div class="stat-cards">' + cards.map(function (c) {
      return '<div class="card stat-card"><div class="s-label">' + icon(c.icon, 14) + ' ' + c.label + '</div><b>' + c.val + '</b><div class="s-sub">' + esc(c.sub) + '</div></div>';
    }).join('') + '</div>' +
      '<div class="stat-two">' +
      '<div class="card chart-card"><h3>近 7 天练习量</h3><div class="sub">按每天完成的跟读句子数统计</div>' +
      '<div class="chart">' + chartBars + '</div><div class="chart-labels">' + chartLabels + '</div></div>' +
      '<div class="card level-card"><h3>当前等级</h3><div class="sub">每 200 XP 升一级</div>' +
      '<div class="level-row"><div class="level-badge">' + lvl.level + '</div><div><b>Lv.' + lvl.level + ' · 开口练习生</b><span>' + lvl.current + ' / ' + lvl.target + ' XP</span></div></div>' +
      '<div class="side-progress" style="margin-top:0"><span style="width:' + (lvl.progress * 100) + '%"></span></div>' +
      '<div class="divider"></div><div style="font-size:11px;color:var(--ink-4);line-height:1.7">' + placeLine + '<br>专属路线共 ' + SB.store.getRoute().order.length + ' 关，已通关 ' + SB.store.completedLessons() + ' 关，累计 ' + SB.store.totalStars() + ' 颗星。<br>坚持比强度更重要，每天 5 分钟就能看到变化。</div>' +
      '</div></div>' +
      '<div class="section-head"><div><h2>需要加强的发音</h2><p>根据逐词评分结果自动汇总</p></div></div>' +
      '<div class="card" style="padding:18px"><div class="weak-list">' + weakHTML + '</div></div>';
  }

  /* ---------------- 成就页 ---------------- */
  function viewAchievements() {
    var earned = SB.store.achievements();
    var items = SB.data.achievements.map(function (a) {
      var got = earned.indexOf(a.id) !== -1;
      return '<div class="achievement' + (got ? '' : ' locked') + '"><div class="a-icon">' + icon(a.icon, 20) + '</div>' +
        '<div><h4>' + esc(a.title) + '</h4><p>' + esc(a.desc) + (got ? ' · 已达成' : ' · 未达成') + '</p></div></div>';
    }).join('');
    return '<div class="section-head" style="margin-top:0"><div><h2>成就徽章</h2><p>已解锁 ' + earned.length + ' / ' + SB.data.achievements.length + '</p></div>' +
      '<div class="head-actions">' +
        '<button class="btn btn-ghost" data-action="backup-modal">' + icon('shield', 14) + ' 我的学习记录</button>' +
        '<button class="btn btn-ghost" data-action="confirm-reset">' + icon('settings', 14) + ' 重置学习数据</button>' +
      '</div></div>' +
      '<div class="achievement-grid">' + items + '</div>' +
      '<div class="card" style="margin-top:24px;padding:20px;font-size:12px;color:var(--ink-3);line-height:1.8">' +
      '<b style="color:var(--ink-2)">两种练习方式</b><br>' +
      '<b>跟读闯关：</b>听标准发音、照着句子读，逐词纠音，练的是「说得准」。<br>' +
      '<b>情景对话：</b>扮演真实角色，对方先开口、你自己组织一句话回应，每轮有 2 种以上可接受说法，按「沟通达成度 + 表达质量」评分，练的是「说得出」。对话同样计入 XP、连击、星数与每日任务。<br>' +
      '<b style="color:var(--ink-2)">定级测评怎么影响路线</b><br>' +
      '选完兴趣后有一份约 1 分钟的入学测评：4 道自适应跟读题（答得好就升难度，卡住就降难度）+ 2 道理解题，综合判定 A2 初级 / B1 中级 / B2 高级。兴趣决定「学什么」，水平决定「从哪开始」——起点之前的阶段变成全部开放的可选热身，不强制刷；重新测评只改水平和路线，兴趣、星星与 XP 全部保留。<br>' +
      '<b style="color:var(--ink-2)">奖励机制怎么运作</b><br>' +
      '每句结束立刻给分、逐词着色并播放反馈音；连续两句 80 分以上进入连击，XP 加成最高 ×2；每天 3 个小任务全部完成可开启宝箱，拿到 25–55 XP 的随机奖励；升级、成就、开箱都有全屏庆祝动画。<br>' +
      '<b style="color:var(--ink-2)">关于评分</b><br>' +
      '真实模式：浏览器调用语音识别返回文本，系统再做词级对齐，结合语速、停顿与音量给出三维评分。建议用 Chrome 通过 localhost / HTTPS 打开并允许麦克风。<br>' +
      '体验模式：由你在顶栏手动开启（也可在「未检测到声音」结果页一键开启），模拟数据演示完整流程并明确标注，XP 减半。没有识别到发音时不会自动给分。<br>' +
      '发音设置：顶栏耳机按钮可切换英语音色与语速、试听短句。默认已自动选好本地音色，点「听标准发音」即可出声；本地引擎卡住时会自动重试，若仍不出声则自动改播在线 MP3，无需手动配置。弹窗里能看到实际使用的音色与重试次数。<br>' +
      '<b style="color:var(--ink-2)">下次进来，学习记录还在吗？</b><br>' +
      '在。进度自动保存在这台电脑的这个浏览器里（localStorage），不用登录、不上传服务器；同一浏览器、同一打开地址再来，兴趣、定级、关卡星数、XP、连击、对话成绩都会保留。<br>' +
      '但清除浏览器数据、无痕窗口、换浏览器 / 换电脑，或在「直接双击 index.html」与「localhost 网页」之间切换时会读不到（两者来源不同、数据不互通）。点右上角「我的学习记录」可以查看存档状态、导出 JSON 备份，换设备时用备份恢复即可。</div>';
  }

  /* ---------------- 视图渲染 ---------------- */
  function renderView() {
    var view = doc.getElementById('view');
    if (!view) return;
    var html = '';
    if (state.route === 'home') html = viewHome();
    else if (state.route === 'practice') html = viewPractice();
    else if (state.route === 'finish') html = viewFinish();
    else if (state.route === 'stats') html = viewStats();
    else if (state.route === 'dialogue') html = viewDialogueList();
    else if (state.route === 'dialogue-play') html = viewDialoguePlay();
    else html = viewAchievements();
    view.innerHTML = '<div class="page">' + html + '</div>';
    if (state.route === 'practice') {
      updatePracticeUI();
      if (state.lastResult) renderFeedback(state.lastResult);
    } else if (state.route === 'dialogue-play') {
      updateDlgUI();
      var chat = doc.getElementById('dlg-chat');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }
  }

  /* ---------------- 交互 ---------------- */
  /** 把按钮上的「档位」换算成用户设置的实际语速：标准 = 设置值，慢速 = 0.7 倍。 */
  function effectiveRate(rate) {
    var base = SB.speech.settings().rate;
    if (!rate || rate >= 0.9) return base;
    if (rate >= 0.8) return Math.max(0.55, base * 0.94);
    return Math.max(0.5, base * 0.7);
  }
  function ttsFailMessage(res) {
    var r = (res && res.reason) || 'unknown';
    if (r === 'not-allowed') return '浏览器拦截了自动朗读（新域名首次打开常见）：点下方「开启发音」一次即可，之后全程自动播放；若仍无声请检查站点声音权限';
    if (r === 'unsupported') return '当前浏览器不支持语音合成，建议改用 Chrome 打开';
    if (r === 'online-failed') return '在线发音这次没加载出来，应用里无需设置：点下方「点一下重播」再试一次即可。若反复失败，多半是网络或广告拦截插件挡住了发音接口（有道 / 百度 / Google），暂时关掉插件或换个网络再试；也顺手确认系统音量与输出设备。';
    if (r === 'no-start' || r === 'stalled') return '本地音色没启动，已自动改播在线发音；仍无声请点「点一下重播」再试一次';
    if (r === 'interrupted') return '朗读被打断了，再点一次播放即可';
    if (r === 'language-unavailable' || r === 'voice-unavailable') return '当前音色不可用，请在「发音设置」里换一个英语音色';
    return '朗读未完成（' + r + '），可在「发音设置」里换音色再试';
  }

  /** 朗读失败时在题目区留一条持久提示，避免「点了没反应、也没任何说明」。 */
  function showTtsWarn(msg) {
    var host = doc.querySelector('.assess-tools') || doc.querySelector('.sentence-tools') || doc.querySelector('.tts-test');
    if (!host) return;
    var el = doc.getElementById('tts-inline-warn');
    if (!el) {
      el = doc.createElement('div');
      el.id = 'tts-inline-warn';
      el.className = 'tts-inline-warn';
      host.insertAdjacentElement('afterend', el);
    }
    el.innerHTML = icon('alert', 13) + '<span>' + esc(msg) + '</span>';
  }
  function clearTtsWarn() {
    var el = doc.getElementById('tts-inline-warn');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /** Chrome 要求文档至少有过一次用户激活才放行 speechSynthesis，而且这个许可
   *  是按文档 + 按 origin 的：线上新域名第一次打开、或刷新页面后，测评/对话的
   *  自动朗读会被静默拦成 not-allowed。这里不再赌运气，直接给一步到位的入口：
   *  这一次点击既解锁引擎，也把当前该听的句子读出来，之后整个单页会话都能自动朗读。 */
  function showVoiceGate(text, label) {
    if (doc.querySelector('.tts-modal')) return; // 设置弹窗里已有「播放试听」
    if (doc.getElementById('voice-gate')) {
      // 已经显示过了：刷新按钮文案即可，避免重复堆叠浮层
      var oldBtn = doc.querySelector('#voice-gate [data-action="voice-unlock"]');
      if (oldBtn && label) oldBtn.innerHTML = icon('play', 13) + ' ' + esc(label);
      return;
    }
    // 固定浮层：测评/练习/对话/首页局部 DOM 都会被重绘，浮层不会被冲掉，
    // 也保证「线上第一次打开」时用户一定看得见这个唯一需要的操作。
    var host = doc.getElementById('app') || doc.body;
    var box = doc.createElement('div');
    box.className = 'voice-gate';
    box.id = 'voice-gate';
    box.innerHTML =
      '<div class="voice-gate-icon">' + icon('volume', 18) + '</div>' +
      '<div class="voice-gate-copy"><b>再点一次就能出声</b>' +
        '<span>浏览器要求由一次真实点击来放行声音。点下面按钮会立刻重读这一句；应用里不需要设置，也无需换音色。</span></div>' +
      '<button type="button" class="btn btn-primary" data-action="voice-unlock" data-text="' + esc(text) + '">' +
        icon('play', 13) + ' ' + esc(label || '点一下开启') + '</button>';
    host.appendChild(box);
  }
  function clearVoiceGate() {
    var el = doc.getElementById('voice-gate');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  var onlineNotified = false;
  function speakText(text, rate, btn, quiet) {
    if (btn) btn.classList.add('playing');
    return SB.speech.speak(text, { rate: effectiveRate(rate) }).then(function (res) {
      if (btn) btn.classList.remove('playing');
      if (!res || !res.ok) {
        var msg = ttsFailMessage(res);
        if (!quiet) toast(msg, 'warn');
        showTtsWarn(msg);
        if (res && (res.reason === 'not-allowed' || res.reason === 'online-failed')) {
          showVoiceGate(text, '点一下重播');
        }
      } else {
        clearTtsWarn();
        clearVoiceGate();
        // 本地引擎起不来时已自动改播在线 MP3，明确告知一次，避免用户以为还是坏了
        if (res.fallback && !onlineNotified) {
          onlineNotified = true;
          if (!quiet) toast('本地发音引擎不可用，已自动切换为在线发音', 'success');
        }
        // 只有真的播出来了才计入「听 1 次标准发音」任务
        if (state.route === 'practice') SB.store.markListen();
      }
      return res;
    });
  }
  /** 把「为什么没声音」拆成可观测指标，并给出下一步该点哪个按钮。 */
  function ttsDiagHTML() {
    var d = SB.speech.diagnostics();
    var engine = d.paused ? '已暂停' : d.speaking ? '正在播放' : d.pending ? '队列等待中' : '空闲';
    var last = d.status && d.status.attempts
      ? (d.status.ok ? '成功' : '失败 · ' + esc(d.status.reason)) : '尚未试听';
    var auto = d.autoVoice ? d.autoVoice.name + (d.autoVoice.local ? ' · 本地' : '') : '暂无';
    var rows = [
      ['语音合成', d.supported ? '支持' : '不支持'],
      ['可用音色', d.voices + ' · 英语 ' + d.english + ' / 本地 ' + d.local],
      ['自动选中', esc(auto)],
      ['发音来源', d.localBroken ? '在线发音（自动兜底）' : '本地语音引擎'],
      ['引擎状态', engine],
      ['上次朗读', last]
    ];
    var advice;
    if (!d.supported) advice = '当前浏览器不提供语音合成能力，请用 Chrome 或 Edge 打开。';
    else if (!d.voices) advice = '浏览器还没有加载到任何语音包，请点「重置语音引擎」，或检查系统是否安装了语音合成语音。';
    else if (!d.english) advice = '没有英语音色，中文音色读英文可能不出声。请在下方音色列表里手动选一个，或改用 Chrome。';
    else if (d.paused) advice = '语音引擎处于暂停状态，点「重置语音引擎」后再试听。';
    else if (d.status && d.status.reason === 'not-allowed') advice = '浏览器拦截了自动朗读：新域名第一次打开、或刚刷新页面时必须先有一次点击。页面上会出现「开启发音」按钮，点一次即可解锁；若仍无声，请检查该站点的声音权限（Chrome 按域名分别记忆，localhost 允许不代表线上域名允许）。';
    else if (d.status && d.status.reason === 'online-failed') advice = '三个在线发音源这次都没加载出来：先点页面上的「点一下重播」再试一次。若反复失败，通常是网络不通、公司代理或广告拦截插件挡住了有道 / 百度 / Google 的发音接口；暂时关掉插件或换个网络即可。应用内部无需任何设置，也不用换音色。';
    else if (d.localBroken) advice = '本地语音引擎连续启动失败，已自动改为在线发音（需要网络，点击即出声）。点「重置语音引擎」可以再试一次本地音色。';
    else if (d.status && d.status.fallback) advice = '上一次本地引擎没启动，已自动用在线发音播出。属正常兜底，不影响练习；想用本地音色可点「重置语音引擎」再试听。';
    else if (d.status && (d.status.reason === 'no-start' || d.status.reason === 'stalled')) advice = '朗读没启动。先点「测设备音量」：听得到说明设备正常、是语音引擎卡住，点「重置语音引擎」再试；听不到就是系统静音或浏览器音频被禁用。';
    else if (d.status && d.status.attempts && !d.status.ok) advice = esc(ttsFailMessage(d.status));
    else advice = '引擎看起来正常，已自动选好本地英语音色。点「播放试听」应该立刻出声；如果仍没声音，先点「测设备音量」确认设备能出声，系统会自动切换到在线发音。';
    return '<div class="tts-diag-grid">' + rows.map(function (r) {
      return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('') + '</div>' +
      '<div class="tts-advice">' + icon('info', 14) + '<div>' + advice + '</div></div>' +
      '<div class="tts-device-result" id="tts-device-result"></div>';
  }
  function refreshTtsDiag() {
    var box = doc.getElementById('tts-diag-box');
    if (box) box.innerHTML = ttsDiagHTML();
  }

  function showTtsModal() {
    var s = SB.speech.settings();
    var list = SB.speech.voiceList();
    var autoName = s.autoVoice ? s.autoVoice.name : '';
    var options = '<option value=""' + (s.auto ? ' selected' : '') + '>自动选择 · 优先本地音色（推荐）' +
      (s.auto && autoName ? ' · 当前 ' + esc(autoName) : '') + '</option>' + list.map(function (v) {
      var sel = !s.auto && (v.voiceURI === s.voiceURI || v.name === s.voiceName) ? ' selected' : '';
      return '<option value="' + esc(v.voiceURI) + '" data-name="' + esc(v.name) + '"' + sel + '>' +
        esc(v.name) + ' · ' + esc(v.lang) + (v.local ? ' · 本地' : ' · 在线') + '</option>';
    }).join('');
    var rates = [0.75, 0.92, 1.0, 1.1].map(function (r) {
      return '<button type="button" class="rate-chip' + (Math.abs(s.rate - r) < 0.02 ? ' on' : '') + '" data-action="tts-rate" data-rate="' + r + '">' + r.toFixed(2).replace(/0$/, '') + 'x</button>';
    }).join('');
    doc.getElementById('modal-root').innerHTML =
      '<div class="modal-mask"><div class="modal tts-modal">' +
      '<div class="tts-head"><div class="tts-head-icon">' + icon('headphones', 20) + '</div><div><h3>发音设置</h3><p>没声音？先做两项自检，再换音色</p></div>' +
      '<button class="icon-btn" data-action="close-modal" title="关闭">' + icon('close', 16) + '</button></div>' +
      '<div class="tts-diag" id="tts-diag-box">' + ttsDiagHTML() + '</div>' +
      '<div class="tts-field"><label>英语音色</label>' +
      '<select id="tts-voice" data-action="tts-voice">' + options + '</select>' +
      '<div class="hint">默认「自动选择」会帮你挑好并记住一个本地英语音色' + (autoName ? '（当前：<b>' + esc(autoName) + '</b>）' : '') + '，无需手动设置。带「本地」的音色直接在设备上合成，通常最流畅；共 ' + list.length + ' 个英语音色。换完音色记得再点一次「播放试听」。</div></div>' +
      '<div class="tts-field"><label>朗读语速</label><div class="rate-row">' + rates + '</div>' +
      '<div class="hint">有些音色在过快或过慢的语速下会卡顿，1.00x 最稳。系统检测到卡住时会自动重试一次；若本地引擎仍不出声，会自动改播在线 MP3，保证点一下就有声音。</div></div>' +
      '<div class="tts-test"><div><b>试听一句</b><p>Is the flight on time?</p></div>' +
      '<button type="button" class="btn btn-primary" data-action="tts-test">' + icon('play', 14) + ' 播放试听</button></div>' +
      '<div class="tts-test-actions">' +
      '<button type="button" class="btn btn-ghost" data-action="tts-test-device">' + icon('volume', 14) + ' 测设备音量</button>' +
      '<button type="button" class="btn btn-ghost" data-action="tts-reset-engine">' + icon('refresh', 14) + ' 重置语音引擎</button>' +
      '</div>' +
      '<div class="tts-status" id="tts-status"></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-action="tts-reset">恢复默认</button>' +
      '<button class="btn btn-primary" data-action="close-modal">完成</button></div></div></div>';
    updateTtsStatus();
  }
  function updateTtsStatus() {
    var el = doc.getElementById('tts-status');
    if (!el) return;
    var s = SB.speech.settings();
    if (!s.status || !s.status.attempts) {
      el.innerHTML = icon('info', 13) + ' 试听后会显示实际使用的音色与是否有自动修复。';
      return;
    }
    var st = s.status;
    el.innerHTML = icon(st.ok ? 'checkCircle' : 'alert', 13) +
      (st.ok ? '播放完成' : '播放未完成') + ' · 音色「' + esc(st.voice || '系统默认') + '」 · 尝试 ' + st.attempts + ' 次' +
      (st.attempts > 1 ? '（已自动换音色重试）' : '') +
      (!st.ok ? '<span class="tts-status-tip">' + esc(ttsFailMessage(st)) + '</span>' : '');
  }
  /* ---------------- 学习记录备份与恢复 ---------------- */
  /** 同步码：把精简存档编码成一段可复制的文本，跨地址 / 跨设备迁移不用找文件。 */
  function encodeSyncCode(data) {
    var json = JSON.stringify(data);
    var bin;
    if (global.TextEncoder) {
      var bytes = new global.TextEncoder().encode(json);
      bin = '';
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    } else {
      bin = unescape(encodeURIComponent(json));
    }
    return 'SB1:' + btoa(bin);
  }
  function decodeSyncCode(code) {
    var s = String(code || '').trim().replace(/\s+/g, '');
    if (s.indexOf('SB1:') !== 0) throw new Error('同步码应以 SB1: 开头');
    var bin = atob(s.slice(4));
    var json;
    if (global.TextDecoder) {
      var buf = new Uint8Array(bin.length);
      for (var j = 0; j < bin.length; j++) buf[j] = bin.charCodeAt(j);
      json = new global.TextDecoder().decode(buf);
    } else {
      json = decodeURIComponent(escape(bin));
    }
    return JSON.parse(json);
  }
  function copySyncCode() {
    var code = encodeSyncCode(SB.store.exportCompact());
    var manual = function () {
      var out = doc.getElementById('sync-output');
      var box = doc.getElementById('sync-output-box');
      if (out && box) { box.style.display = 'block'; out.value = code; out.focus(); out.select(); }
      toast('自动复制不可用，已显示同步码，请手动全选复制', 'warn');
      return false;
    };
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(code).then(function () {
        toast('同步码已复制，粘贴到备忘录保存即可', 'success');
        return true;
      }).catch(manual);
    }
    try {
      var ta = doc.createElement('textarea');
      ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      var ok = doc.execCommand('copy');
      doc.body.removeChild(ta);
      if (ok) { toast('同步码已复制，粘贴到备忘录保存即可', 'success'); return Promise.resolve(true); }
    } catch (e) { /* noop */ }
    return Promise.resolve(manual());
  }
  function restoreFromSyncCode() {
    var input = doc.getElementById('sync-input');
    if (!input || !input.value.trim()) { toast('请先粘贴同步码', 'warn'); return; }
    var data;
    try { data = decodeSyncCode(input.value); }
    catch (e) { toast('同步码无效：' + e.message, 'warn'); return; }
    var res = SB.store.importBackup(data);
    if (!res.ok) { toast(res.reason, 'warn'); return; }
    toast('已恢复 ' + res.lessons + ' 关 · ' + res.dialogues + ' 场对话 · ' + res.xp + ' XP', 'success');
    setTimeout(function () { global.location.reload(); }, 950);
  }

  function showBackupModal() {
    var info = SB.store.storageInfo();
    var rows = [
      ['存档位置', esc(info.origin) + ' · 本机浏览器'],
      ['已通关关卡', info.lessons + ' 关'],
      ['完成对话', info.dialogues + ' 场'],
      ['累计跟读', info.sentences + ' 句'],
      ['累计经验', info.xp + ' XP'],
      ['本机存储', info.available ? '可用 · 记录会自动保存' : '不可用 · 关闭页面后会丢失，请导出备份']
    ];
    doc.getElementById('modal-root').innerHTML =
      '<div class="modal-mask"><div class="modal backup-modal">' +
      '<div class="tts-head"><div class="tts-head-icon">' + icon('shield', 20) + '</div>' +
      '<div><h3>我的学习记录</h3><p>记录在哪、下次还在不在、怎么带走</p></div>' +
      '<button class="icon-btn" data-action="close-modal" title="关闭">' + icon('close', 16) + '</button></div>' +
      '<div class="backup-answer">' + icon('checkCircle', 15) +
      '<div><b>下次在这台电脑打开，记录还在。</b><span>进度自动保存在这个浏览器的本机存储里（localStorage），不用登录、不上传服务器。同一浏览器、同一打开地址再来，兴趣、定级、关卡星数、XP、连击、对话成绩都会保留。</span></div></div>' +
      (info.recovered ? '<div class="backup-answer">' + icon('refresh', 15) + '<div><b>已从本地快照自动恢复记录。</b><span>主存档曾损坏或被清掉，系统自动用冗余镜像恢复了进度。</span></div></div>' : '') +
      '<div class="backup-warn">' + icon('alert', 14) +
      '<div><b>发版后记录「不见了」，多半是换了打开地址。</b>记录绑定在<b>当前这个地址</b>（<code>' + esc(info.origin) + '</code>）：端口、域名、或「直接双击 index.html」与「localhost 网页」只要不一样，就是两份互不相通的存档。请固定用同一个地址访问；清浏览器数据、无痕窗口、换浏览器 / 换电脑同理会读不到。</div></div>' +
      (!info.hasRecords ? '<div class="backup-empty">' + icon('info', 14) + ' 当前地址还没有学习记录。如果你是更新后第一次打开，用下面的同步码或备份文件恢复即可，不用重新练。</div>' : '') +
      '<div class="backup-actions">' +
      '<button type="button" class="btn btn-primary" data-action="backup-export">' + icon('download', 14) + ' 导出备份文件</button>' +
      '<button type="button" class="btn btn-outline" data-action="backup-import">' + icon('upload', 14) + ' 从备份恢复</button>' +
      '</div>' +
      '<div class="backup-sync">' +
        '<div class="backup-sync-head">' + icon('bolt', 14) + ' 换地址 / 换设备最省事：同步码</div>' +
        '<p>把进度变成一段文本存进备忘录或发给自己；新地址打开后粘贴回来就能恢复，不用找文件。建议每次练完顺手复制一次。</p>' +
        '<div class="backup-actions">' +
          '<button type="button" class="btn btn-soft" data-action="sync-copy">复制同步码</button>' +
          '<button type="button" class="btn btn-outline" data-action="sync-toggle">粘贴同步码恢复</button>' +
        '</div>' +
        '<div class="sync-box" id="sync-output-box" style="display:none">' +
          '<label>手动复制这段文本</label><textarea id="sync-output" rows="3" readonly></textarea></div>' +
        '<div class="sync-box" id="sync-paste-box" style="display:none">' +
          '<label>粘贴之前保存的同步码</label><textarea id="sync-input" rows="3" placeholder="SB1:..."></textarea>' +
          '<button type="button" class="btn btn-primary" data-action="sync-restore">恢复记录</button></div>' +
      '</div>' +
      '<div class="backup-summary">' + rows.map(function (r) {
        return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
      }).join('') + '</div>' +
      '<input type="file" id="backup-file" accept=".json,application/json" style="display:none">' +
      '<div class="hint">恢复会覆盖当前记录。同步码只包含核心进度，备份文件包含完整的每日明细。</div>' +
      '</div></div>';
    var input = doc.getElementById('backup-file');
    if (input) input.addEventListener('change', handleBackupFile);
  }

  function exportBackupFile() {
    try {
      var data = SB.store.exportBackup();
      var blob = new global.Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = global.URL.createObjectURL(blob);
      var a = doc.createElement('a');
      a.href = url;
      a.download = 'speakbuddy-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      doc.body.appendChild(a);
      a.click();
      doc.body.removeChild(a);
      setTimeout(function () { global.URL.revokeObjectURL(url); }, 1000);
      toast('备份已导出，请把这个 JSON 文件收好', 'success');
    } catch (e) {
      toast('导出失败：' + (e && e.message ? e.message : '未知错误'), 'warn');
    }
  }

  function handleBackupFile(e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new global.FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(String(reader.result)); }
      catch (err) { toast('文件不是有效的 JSON', 'warn'); return; }
      var res = SB.store.importBackup(parsed);
      if (!res.ok) { toast(res.reason, 'warn'); return; }
      toast('已恢复 ' + res.lessons + ' 关 · ' + res.dialogues + ' 场对话 · ' + res.xp + ' XP，正在刷新…', 'success');
      setTimeout(function () { global.location.reload(); }, 950);
    };
    reader.onerror = function () { toast('读取文件失败', 'warn'); };
    reader.readAsText(file);
  }

  function openLesson(id) {
    var lesson = SB.data.getLesson(id);
    if (!lesson) return;
    if (!SB.store.isUnlocked(id)) { toast('先完成路线上的上一关，才能解锁这一关', 'warn'); return; }
    resetSession(id);
    go('#/practice/' + id);
  }
  function showResetModal() {
    doc.getElementById('modal-root').innerHTML = '<div class="modal-mask"><div class="modal"><h3>重置学习数据？</h3>' +
      '<p>将清空所有 XP、星星、连击、打卡记录与兴趣选择，并回到首次进入的兴趣引导。此操作无法撤销。</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-action="close-modal">取消</button>' +
      '<button class="btn btn-primary" data-action="do-reset">确认重置</button></div></div></div>';
  }

  doc.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-action]');
    if (!el) {
      if (e.target.classList && e.target.classList.contains('modal-mask')) doc.getElementById('modal-root').innerHTML = '';
      return;
    }
    var a = el.dataset.action;
    if (a === 'nav') go('#/' + el.dataset.to);
    else if (a === 'lesson') openLesson(el.dataset.id);
    else if (a === 'locked') toast('先完成路线上的上一关，才能解锁这一关', 'warn');
    else if (a === 'speak-text') speakText(el.dataset.text, parseFloat(el.dataset.rate), el);
    else if (a === 'speak-word') speakText(el.dataset.word, 0.85, null);
    else if (a === 'record') { if (state.phase === 'recording') endRecording(); else startRecording(); }
    else if (a === 'retry') { clearSentence(); renderView(); }
    else if (a === 'next') nextSentence();
    else if (a === 'listen-self') {
      if (state.lastResult && state.lastResult.metrics && state.lastResult.metrics.url) {
        new global.Audio(state.lastResult.metrics.url).play().catch(function () { toast('录音回放不可用', 'warn'); });
      }
    }
    else if (a === 'restart') openLesson(el.dataset.id);
    else if (a === 'toggle-mode') {
      state.demoMode = !state.demoMode;
      renderChrome();
      toast(state.demoMode ? '体验模式已开启：不调用麦克风，直接演示完整评分流程' : '已切回真实模式', state.demoMode ? 'warn' : 'success');
    }
    else if (a === 'enable-demo') {
      state.demoMode = true;
      renderChrome();
      toast('体验模式已开启：点「重新录音」即可用模拟数据演示完整评分流程', 'success');
    }
    else if (a === 'assess-retry') {
      var ar = state.assessment;
      if (!ar) return;
      ar.phase = 'idle';
      ar.ending = false;
      ar.lastScore = null;
      ar.autoMetrics = null;
      ar.recognitionPayload = null;
      ar.recognitionPromise = null;
      var arBox = doc.getElementById('assess-result');
      if (arBox) arBox.innerHTML = '';
      updateAssessRecordUI();
    }
    else if (a === 'toggle-sound') {
      var on = SB.store.toggleSound();
      SB.fx.setEnabled(on);
      if (on) SB.fx.play('click');
      renderChrome();
      toast(on ? '音效已开启' : '音效已关闭');
    }
    else if (a === 'toggle-all') { state.showAll = !state.showAll; renderView(); }
    /* ---- 情景对话 ---- */
    else if (a === 'dlg-filter') { state.dlgFilter = el.dataset.filter; renderView(); SB.fx.play('click'); }
    else if (a === 'dlg-start') { startDialogue(el.dataset.id); go('#/dialogue/' + el.dataset.id); }
    else if (a === 'dlg-listen') {
      speakText(el.dataset.text, 0.9, el);
      SB.store.markListen();
    }
    else if (a === 'dlg-hint') { state.dialogue.showHint = !state.dialogue.showHint; renderView(); }
    else if (a === 'dlg-record') {
      var dg = state.dialogue;
      if (!dg) return;
      if (dg.phase === 'recording') endDlgRecording();
      else if (dg.phase === 'idle') startDlgRecording();
    }
    else if (a === 'dlg-quick') dlgQuick();
    else if (a === 'dlg-retry') dlgRetry();
    else if (a === 'dlg-next') dlgNext();
    else if (a === 'dlg-again') {
      startDialogue(el.dataset.id || (state.dialogue && state.dialogue.id));
      renderChrome(); renderView();
    }
    else if (a === 'edit-interests') showInterestModal();
    else if (a === 'voice-unlock') {
      var vText = el.dataset.text;
      el.disabled = true;
      el.innerHTML = icon('volume', 13) + ' 正在朗读…';
      speakText(vText, 0.9, null, true).then(function (res) {
        el.disabled = false;
        if (res && res.ok) { clearVoiceGate(); toast('发音已开启，之后会自动朗读', 'success'); }
        else el.innerHTML = icon('play', 13) + ' 再点一次开启';
      });
    }
    else if (a === 'tts-settings') showTtsModal();
    else if (a === 'tts-rate') {
      var tr = parseFloat(el.dataset.rate);
      SB.speech.setRate(tr);
      var chips = doc.querySelectorAll('.rate-chip');
      for (var ci = 0; ci < chips.length; ci++) chips[ci].classList.toggle('on', Math.abs(parseFloat(chips[ci].dataset.rate) - tr) < 0.02);
      SB.fx.play('click');
    }
    else if (a === 'tts-reset') { SB.speech.setVoice('', ''); SB.speech.setRate(0.92); showTtsModal(); toast('已恢复默认音色与语速', 'success'); }
    else if (a === 'tts-test') {
      el.disabled = true;
      SB.speech.speak('Is the flight on time?').then(function () {
        el.disabled = false;
        updateTtsStatus();
        refreshTtsDiag();
      });
    }
    else if (a === 'tts-test-device') {
      el.disabled = true;
      SB.fx.testTone().then(function (ok) {
        el.disabled = false;
        var box = doc.getElementById('tts-device-result');
        if (!ok) {
          if (box) box.innerHTML = icon('alert', 13) + ' 当前浏览器无法输出音频，请检查系统音量、静音开关和站点声音权限。';
          toast('设备没有输出测试音，问题不在语音引擎', 'warn');
        } else {
          if (box) box.innerHTML = icon('checkCircle', 13) + ' 已播放一段测试音。听得到 → 设备正常，朗读无声是语音引擎问题；听不到 → 系统静音或音频被禁用。';
          toast('已播放测试音，请确认是否听得到', 'success');
        }
      });
    }
    else if (a === 'tts-reset-engine') {
      var diag = SB.speech.resetEngine();
      toast('语音引擎已重置 · 检测到 ' + diag.english + ' 个英语音色，请再点一次播放试听', 'success');
      showTtsModal();
    }
    else if (a === 'onb-topic') {
      var id = el.dataset.topic;
      var i = state.onb.selected.indexOf(id);
      if (i >= 0) state.onb.selected.splice(i, 1);
      else {
        if (state.onb.selected.length >= 3) { toast('内置话题最多选 3 个', 'warn'); return; }
        state.onb.selected.push(id);
      }
      refreshTopicUI(); SB.fx.play('click');
    }
    else if (a === 'onb-add') addCustomTopic();
    else if (a === 'onb-remove') { state.onb.custom.splice(parseInt(el.dataset.index, 10), 1); refreshTopicUI(); SB.fx.play('click'); }
    else if (a === 'onb-submit') submitOnboarding(false);
    else if (a === 'onb-submit-edit') submitOnboarding(true);
    /* ---- 定级测评 ---- */
    else if (a === 'assess-cancel') cancelAssessment();
    else if (a === 'assess-skip') skipAssessment();
    else if (a === 'assess-listen') {
      var sItem = state.assessment && state.assessment.item && state.assessment.item.sentence;
      if (sItem) speakText(sItem.en, 0.9, el);
    }
    else if (a === 'assess-record') {
      var as = state.assessment;
      if (!as) return;
      if (as.phase === 'recording') endAssessRecording();
      else if (as.phase === 'idle') startAssessRecording();
    }
    else if (a === 'assess-choice') answerChoice(parseInt(el.dataset.index, 10));
    else if (a === 'assess-next') nextAssessmentItem();
    else if (a === 'assess-retake') retakeAssessment();
    else if (a === 'placement-confirm') {
      if (!state.placementResult) { toast('测评结果丢失，请重新测一次', 'warn'); retakeAssessment(); return; }
      completeOnboarding(state.placementResult);
    }
    else if (a === 'start-retest') startAssessment(true);
    else if (a === 'noop') { /* 已作答的选项，忽略重复点击 */ }
    else if (a === 'claim-chest') {
      var chest = SB.store.claimChest();
      if (!chest) { toast('先完成今日的 3 个小任务', 'warn'); return; }
      SB.fx.celebrate({
        kicker: '每日宝箱', title: '今日全勤，开箱！',
        desc: '三件小任务全部完成，这份奖励是你自己一句一句读出来的。',
        reward: '+' + chest.xp + ' XP', sound: 'chest'
      });
      renderChrome(); renderView();
    }
    else if (a === 'confirm-reset') showResetModal();
    else if (a === 'backup-modal') showBackupModal();
    else if (a === 'backup-export') exportBackupFile();
    else if (a === 'backup-import') {
      var bf = doc.getElementById('backup-file');
      if (bf) bf.click();
    }
    else if (a === 'sync-copy') copySyncCode();
    else if (a === 'sync-toggle') {
      var sp = doc.getElementById('sync-paste-box');
      if (sp) sp.style.display = sp.style.display === 'none' ? 'block' : 'none';
      var si = doc.getElementById('sync-input');
      if (si && sp && sp.style.display === 'block') si.focus();
    }
    else if (a === 'sync-restore') restoreFromSyncCode();
    else if (a === 'close-modal') doc.getElementById('modal-root').innerHTML = '';
    else if (a === 'do-reset') {
      SB.store.reset();
      try { global.localStorage.removeItem(FINISH_KEY); } catch (err) { /* noop */ }
      state.finishData = null;
      state.session = null;
      state.showAll = false;
      state.assessment = null;
      state.placementResult = null;
      state.dialogue = null;
      state.dlgFilter = 'all';
      SB.speech.stopSpeaking();
      state.onb = { selected: ['daily', 'travel'], custom: [], generating: false };
      doc.getElementById('modal-root').innerHTML = '';
      mount();
      toast('学习数据已重置，重新选一次兴趣吧', 'success');
    }
  });

  doc.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || el.id !== 'tts-voice') return;
    var opt = el.options[el.selectedIndex];
    SB.speech.setVoice(el.value, opt ? opt.dataset.name || '' : '');
    toast('已切换到「' + (opt ? opt.textContent.split(' · ')[0] : '自动选择') + '」', 'success');
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'onb-input') { e.preventDefault(); addCustomTopic(); }
    var tag = ((e.target && e.target.tagName) || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'button';
    var as = state.assessment;
    if (e.code === 'Space' && as && as.item && as.item.type === 'speaking' &&
        (as.phase === 'idle' || as.phase === 'recording')) {
      if (typing) return;
      e.preventDefault();
      if (as.phase === 'recording') endAssessRecording(); else startAssessRecording();
      return;
    }
    var dg = state.dialogue;
    if (e.code === 'Space' && !as && state.route === 'dialogue-play' && dg &&
        (dg.phase === 'idle' || dg.phase === 'recording')) {
      if (typing) return;
      e.preventDefault();
      if (dg.phase === 'recording') endDlgRecording(); else startDlgRecording();
      return;
    }
    if (e.code === 'Space' && !as && state.route === 'practice' && (state.phase === 'idle' || state.phase === 'recording')) {
      if (typing) return;
      e.preventDefault();
      if (state.phase === 'recording') endRecording(); else startRecording();
    }
    if (e.key === 'Escape') doc.getElementById('modal-root').innerHTML = '';
  });

  global.addEventListener('hashchange', onRoute);

  /* ---------------- 启动 ---------------- */
  function mount() {
    SB.fx.setEnabled(SB.store.isSoundOn());
    doc.getElementById('app').innerHTML =
      '<div class="app-shell">' +
      '<aside class="sidebar" id="sidebar"></aside>' +
      '<main class="main" id="main"><header class="topbar" id="topbar"></header><div class="view" id="view"></div></main>' +
      '</div>';
    if (!global.location.hash) global.location.hash = '#/home';
    onRoute();
    if (SB.store.storageInfo().recovered) {
      setTimeout(function () { toast('已从本地快照自动恢复学习记录', 'success'); }, 350);
    }
  }

  state.onb.selected = ['daily', 'travel']; // 预选两个高频话题，降低起步门槛
  mount();
})(window);
