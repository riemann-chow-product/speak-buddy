/* SpeakBuddy - 本地进度存档（localStorage，无后端） */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});
  var KEY = 'speakbuddy.v1';

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return dateStr(d); }

  var TASK_DEFS = [
    { id: 'sentences', title: '完成 3 句跟读', desc: '开口最重要，先完成三句', metric: 'sentences', target: 3, unit: '句', icon: 'mic' },
    { id: 'highscore', title: '单句拿到 85 分', desc: '挑一句读到你满意', metric: 'best', target: 85, unit: '分', icon: 'star' },
    { id: 'listen', title: '听 1 次标准发音', desc: '先听后读，进步更快', metric: 'listens', target: 1, unit: '次', icon: 'volume' }
  ];

  function defaults() {
    return {
      version: 2,
      xp: 0,
      maxScore: 0,
      streak: 0,
      lastDate: null,
      totalSeconds: 0,
      totalSentences: 0,
      lessons: {},
      dialogues: {},
      daily: {},
      weak: {},
      achievements: [],
      onboarded: false,
      interests: [],
      placement: null,
      route: null,
      combo: 0,
      bestCombo: 0,
      soundOn: true
    };
  }

  function emptyDay() { return { sentences: 0, seconds: 0, xp: 0, best: 0, listens: 0, chestClaimed: false }; }

  var memoryFallback = null;

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return defaults();
      var parsed = JSON.parse(raw);
      var d = defaults();
      Object.keys(d).forEach(function (k) {
        if (parsed[k] !== undefined && parsed[k] !== null) d[k] = parsed[k];
      });
      // 兼容旧存档：补齐当天新增字段
      Object.keys(d.daily).forEach(function (k) {
        var day = d.daily[k], e = emptyDay();
        Object.keys(e).forEach(function (f) { if (day[f] === undefined) day[f] = e[f]; });
      });
      return d;
    } catch (e) {
      return memoryFallback || defaults();
    }
  }

  var state = load();

  function save() {
    memoryFallback = state;
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 内存兜底 */ }
  }

  function updateStreak() {
    var t = today();
    if (state.lastDate === t) return;
    state.streak = state.lastDate === daysAgo(1) ? (state.streak || 0) + 1 : 1;
    state.lastDate = t;
  }

  function ensureDay() {
    var t = today();
    if (!state.daily[t]) state.daily[t] = emptyDay();
    var day = state.daily[t], e = emptyDay();
    Object.keys(e).forEach(function (f) { if (day[f] === undefined) day[f] = e[f]; });
    return day;
  }

  function level() {
    var lvl = Math.floor(state.xp / 200) + 1;
    return { level: lvl, current: state.xp % 200, target: 200, progress: (state.xp % 200) / 200 };
  }

  function addXp(amount) {
    var before = level().level;
    state.xp += amount;
    var after = level().level;
    return { xp: amount, levelUp: after > before, level: after };
  }

  function checkAchievements() {
    var defs = (SB.data && SB.data.achievements) || [];
    var earned = [];
    defs.forEach(function (a) {
      if (state.achievements.indexOf(a.id) !== -1) return;
      var ok = false;
      if (a.id === 'first') ok = state.totalSentences >= 1;
      else if (a.id === 'streak3') ok = state.streak >= 3;
      else if (a.id === 'star90') ok = state.maxScore >= 90;
      else if (a.id === 'words50') ok = state.totalSentences >= 50;
      else if (a.id === 'unit1') {
        var u1 = (SB.data.units[0] && SB.data.units[0].lessons) || [];
        ok = u1.length > 0 && u1.every(function (l) { return (state.lessons[l.id] && state.lessons[l.id].stars >= 1); });
      }
      else if (a.id === 'allUnits') {
        ok = SB.data.lessons.length > 0 && SB.data.lessons.every(function (l) { return starsFor(l.id) >= 1; });
      }
      if (ok) { state.achievements.push(a.id); earned.push(a); }
    });
    return earned;
  }

  /* ---------------- 兴趣与个性化路线 ---------------- */
  function isOnboarded() { return !!state.onboarded; }
  function interests() { return (state.interests || []).slice(); }

  function setInterests(list, placement) {
    state.interests = (list || []).slice();
    state.placement = placement || null;
    state.route = SB.route.build(state.interests, state.placement);
    state.onboarded = true;
    state.combo = 0;
    save();
    return state.route;
  }

  /** 重新测评后只更新水平与路线，兴趣与已获得的学习进度保持不变。 */
  function setPlacement(placement) {
    state.placement = placement || null;
    state.route = SB.route.build(state.interests || [], state.placement);
    save();
    return state.route;
  }

  function getPlacement() { return state.placement || null; }

  function ensureRoute() {
    // 旧版路线缺少阶段状态；或水平与路线起点不一致（手工改过存档 / 版本迁移），都重建
    if (state.route && (state.route.version < 2 ||
        (state.placement && state.route.startStage !== state.placement.startStage))) {
      state.route = null;
    }
    if (state.onboarded && (!state.route || !state.route.order || !state.route.order.length) && SB.route) {
      state.route = SB.route.build(state.interests || [], state.placement);
      save();
    }
    return getRoute();
  }

  function getRoute() {
    if (state.route && state.route.order && state.route.order.length) return state.route;
    return SB.route ? SB.route.build([]) : null;
  }

  function routeOrder() {
    var r = getRoute();
    return (r && r.order && r.order.length) ? r.order : SB.data.lessons.map(function (l) { return l.id; });
  }

  /* ---------------- 连击 ---------------- */
  function comboMultiplier(c) { return c >= 5 ? 2 : c >= 3 ? 1.5 : c >= 2 ? 1.2 : 1; }
  function comboInfo() {
    var c = state.combo || 0;
    return {
      combo: c,
      best: state.bestCombo || 0,
      multiplier: comboMultiplier(c),
      label: c >= 2 ? '连击 x' + c : '',
      nextHint: c === 0 ? '连续两句 80 分以上，开启连击' : c === 1 ? '再来一句 80+ 就有 XP 加成' : '保持住，加成还会涨'
    };
  }

  /* ---------------- 每日任务与宝箱 ---------------- */
  function tasks() {
    var d = todayStats();
    return TASK_DEFS.map(function (t) {
      var value = d[t.metric] || 0;
      return {
        id: t.id, title: t.title, desc: t.desc, icon: t.icon, unit: t.unit,
        target: t.target, progress: Math.min(value, t.target), done: value >= t.target
      };
    });
  }

  function chestAvailable() {
    return tasks().every(function (t) { return t.done; }) && !todayStats().chestClaimed;
  }

  function claimChest() {
    if (!chestAvailable()) return null;
    var amount = 25 + Math.floor(Math.random() * 7) * 5; // 25 ~ 55 XP，可变奖励
    var reward = addXp(amount);
    var day = ensureDay();
    day.xp += amount;
    day.chestClaimed = true;
    var earned = checkAchievements();
    save();
    return { xp: amount, levelUp: reward.levelUp, level: reward.level, achievements: earned };
  }

  function markListen() {
    var day = ensureDay();
    day.listens += 1;
    save();
  }

  /* ---------------- 练习记录 ---------------- */
  function recordSentence(result) {
    var t = today();
    updateStreak();
    var day = ensureDay();
    day.sentences += 1;
    day.seconds += Math.round((result.metrics && result.metrics.duration) || 0);
    day.xp += result.xp;
    day.best = Math.max(day.best || 0, result.total);

    var reward = addXp(result.xp);
    state.maxScore = Math.max(state.maxScore || 0, result.total);
    state.totalSentences += 1;
    state.totalSeconds += Math.round((result.metrics && result.metrics.duration) || 0);

    state.combo = result.combo || 0;
    state.bestCombo = Math.max(state.bestCombo || 0, state.combo);

    var mistakes = result.words.filter(function (w) { return w.status !== 'correct'; });
    if (mistakes.length) {
      (result.sentence.focus || []).forEach(function (k) { state.weak[k] = (state.weak[k] || 0) + 1; });
    }

    var earned = checkAchievements();
    save();
    return {
      xp: result.xp,
      achievements: earned,
      levelUp: reward.levelUp,
      level: reward.level,
      combo: state.combo,
      chestReady: chestAvailable()
    };
  }

  function recordLesson(lessonId, stars, avgScore) {
    var prev = state.lessons[lessonId] || { stars: 0, best: 0, attempts: 0 };
    state.lessons[lessonId] = {
      stars: Math.max(prev.stars || 0, stars),
      best: Math.max(prev.best || 0, Math.round(avgScore || 0)),
      attempts: (prev.attempts || 0) + 1,
      completedAt: Date.now()
    };
    checkAchievements();
    save();
    return state.lessons[lessonId];
  }

  function lessonRecord(id) { return state.lessons[id] || null; }
  function starsFor(id) { return (state.lessons[id] && state.lessons[id].stars) || 0; }

  /* ---------------- 情景对话存档 ---------------- */
  function recordDialogue(id, stars, avg) {
    var prev = state.dialogues[id] || { stars: 0, best: 0, attempts: 0 };
    state.dialogues[id] = {
      stars: Math.max(prev.stars || 0, stars),
      best: Math.max(prev.best || 0, Math.round(avg || 0)),
      attempts: (prev.attempts || 0) + 1,
      completedAt: Date.now()
    };
    checkAchievements();
    save();
    return state.dialogues[id];
  }
  function dialogueRecord(id) { return state.dialogues[id] || null; }
  function completedDialogues() {
    return Object.keys(state.dialogues).filter(function (k) { return (state.dialogues[k].stars || 0) >= 1; }).length;
  }

  /** 解锁顺序按用户自己的路线，而不是固定课程表。 */
  function isUnlocked(lessonId) {
    var r = getRoute();
    if (r && r.warmupIds && r.warmupIds.indexOf(lessonId) !== -1) return true; // 测评起点之前的阶段全部开放
    var order = routeOrder();
    var i = order.indexOf(lessonId);
    if (i === -1) return true; // 路线之外的课程可自由练习
    if (i === 0) return true;
    if (starsFor(lessonId) >= 1) return true; // 已通关的关卡随时可重练，换兴趣也不会被锁
    return starsFor(order[i - 1]) >= 1;
  }

  function nextPlayableLesson() {
    var order = routeOrder();
    for (var i = 0; i < order.length; i++) {
      var l = SB.data.getLesson(order[i]);
      if (l && isUnlocked(l.id) && starsFor(l.id) < 3) return l;
    }
    return SB.data.getLesson(order[0]) || SB.data.lessons[0];
  }

  function totalStars() {
    var lessonStars = Object.keys(state.lessons).reduce(function (sum, k) { return sum + (state.lessons[k].stars || 0); }, 0);
    // 情景对话的星数也计入累计，避免「结算拿了 3 星、顶栏还是 0 星」的割裂感
    var dialogueStars = Object.keys(state.dialogues || {}).reduce(function (sum, k) { return sum + (state.dialogues[k].stars || 0); }, 0);
    return lessonStars + dialogueStars;
  }
  function completedLessons() {
    return Object.keys(state.lessons).filter(function (k) { return state.lessons[k].stars >= 1; }).length;
  }
  function todayStats() {
    var d = state.daily[today()] || emptyDay();
    var e = emptyDay();
    Object.keys(e).forEach(function (f) { if (d[f] === undefined) d[f] = e[f]; });
    return d;
  }
  function last7() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var key = daysAgo(i);
      var d = new Date(); d.setDate(d.getDate() - i);
      var rec = state.daily[key] || emptyDay();
      out.push({ date: key, label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()], isToday: i === 0, data: rec });
    }
    return out;
  }
  function weakList() {
    var phonemes = (SB.data && SB.data.phonemes) || {};
    return Object.keys(state.weak).map(function (k) {
      return { key: k, count: state.weak[k], label: (phonemes[k] && phonemes[k].label) || k, advice: (phonemes[k] && phonemes[k].advice) || '' };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  }

  function isSoundOn() { return state.soundOn !== false; }
  function toggleSound() { state.soundOn = !isSoundOn(); save(); return isSoundOn(); }

  function reset() { state = defaults(); save(); }

  /* ---------------- 备份与恢复 ----------------
   * 记录存在 localStorage，按「来源（协议 + 域名 + 端口）」隔离：
   * 同一台电脑 / 同一浏览器 / 同一打开方式 → 记录一直在；
   * 清除浏览器数据、无痕窗口、换浏览器、file:// 与 http:// 互换 → 读不到。
   * 所以提供 JSON 备份，让用户能自己迁移与恢复。 */
  var BACKUP_VERSION = 1;
  function exportBackup() {
    var tts = null;
    try { tts = JSON.parse(global.localStorage.getItem('speakbuddy.tts.v1') || 'null'); } catch (e) { /* noop */ }
    return {
      app: 'SpeakBuddy',
      type: 'learning-backup',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state)),
      tts: tts
    };
  }
  function importBackup(data) {
    if (!data || data.app !== 'SpeakBuddy' || data.type !== 'learning-backup' ||
        !data.state || typeof data.state !== 'object') {
      return { ok: false, reason: '这不是有效的 SpeakBuddy 备份文件' };
    }
    var incoming = data.state;
    if (!incoming.lessons || typeof incoming.lessons !== 'object') {
      return { ok: false, reason: '备份内容不完整，缺少学习记录' };
    }
    var d = defaults();
    Object.keys(d).forEach(function (k) {
      if (incoming[k] !== undefined && incoming[k] !== null) d[k] = incoming[k];
    });
    state = d;
    state.route = null; // 交给 ensureRoute() 按当前兴趣与定级重建
    save();
    if (data.tts && typeof data.tts === 'object') {
      try { global.localStorage.setItem('speakbuddy.tts.v1', JSON.stringify(data.tts)); } catch (e) { /* noop */ }
    }
    return {
      ok: true,
      lessons: Object.keys(state.lessons).length,
      dialogues: Object.keys(state.dialogues || {}).length,
      sentences: state.totalSentences || 0,
      xp: state.xp || 0
    };
  }
  function storageInfo() {
    var available = true;
    try {
      global.localStorage.setItem('__sb_probe__', '1');
      global.localStorage.removeItem('__sb_probe__');
    } catch (e) { available = false; }
    var origin = '当前站点';
    try {
      origin = global.location && global.location.protocol === 'file:'
        ? '本地文件 (file://)' : (global.location && global.location.host) || origin;
    } catch (e) { /* noop */ }
    return {
      available: available,
      key: KEY,
      origin: origin,
      lessons: Object.keys(state.lessons).length,
      dialogues: Object.keys(state.dialogues || {}).length,
      sentences: state.totalSentences || 0,
      xp: state.xp || 0,
      onboarded: state.onboarded
    };
  }

  SB.store = {
    get: function () { return state; },
    save: save,
    today: today,
    isOnboarded: isOnboarded,
    interests: interests,
    setInterests: setInterests,
    setPlacement: setPlacement,
    getPlacement: getPlacement,
    getRoute: getRoute,
    ensureRoute: ensureRoute,
    routeOrder: routeOrder,
    comboInfo: comboInfo,
    tasks: tasks,
    chestAvailable: chestAvailable,
    claimChest: claimChest,
    markListen: markListen,
    isSoundOn: isSoundOn,
    toggleSound: toggleSound,
    recordSentence: recordSentence,
    recordLesson: recordLesson,
    recordDialogue: recordDialogue,
    dialogueRecord: dialogueRecord,
    completedDialogues: completedDialogues,
    lessonRecord: lessonRecord,
    starsFor: starsFor,
    isUnlocked: isUnlocked,
    nextPlayableLesson: nextPlayableLesson,
    totalStars: totalStars,
    completedLessons: completedLessons,
    todayStats: todayStats,
    last7: last7,
    weakList: weakList,
    achievements: function () { return state.achievements.slice(); },
    level: level,
    reset: reset,
    exportBackup: exportBackup,
    importBackup: importBackup,
    storageInfo: storageInfo
  };
})(window);
