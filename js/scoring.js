/* SpeakBuddy - 发音评分引擎：逐词对齐 + 准确度 / 流利度 / 完整度 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  var CONTRACTIONS = {
    "i'm": 'i am', "i've": 'i have', "i'll": 'i will', "i'd": 'i would',
    "we're": 'we are', "we'll": 'we will', "we've": 'we have', "we'd": 'we would',
    "you're": 'you are', "you'll": 'you will', "you've": 'you have', "you'd": 'you would',
    "it's": 'it is', "that's": 'that is', "there's": 'there is', "let's": 'let us',
    "he's": 'he is', "she's": 'she is', "what's": 'what is', "where's": 'where is',
    "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "can't": 'cannot',
    "won't": 'will not', "wouldn't": 'would not', "couldn't": 'could not'
  };

  function normalize(text) {
    if (!text) return '';
    var s = String(text).toLowerCase().replace(/[’`´]/g, "'");
    Object.keys(CONTRACTIONS).forEach(function (k) {
      s = s.split(k).join(' ' + CONTRACTIONS[k] + ' ');
    });
    s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  function tokenize(text) {
    var n = normalize(text);
    return n ? n.split(' ') : [];
  }

  function editDistance(a, b) {
    if (a === b) return 0;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur.slice();
    }
    return prev[b.length];
  }

  function similarity(a, b) {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    var d = editDistance(a, b);
    return Math.max(0, 1 - d / Math.max(a.length, b.length));
  }

  /** Needleman-Wunsch 风格的词级对齐，允许近音替换、漏读、多读。 */
  function align(ref, hyp) {
    var n = ref.length, m = hyp.length, i, j;
    var dp = [], trace = [];
    for (i = 0; i <= n; i++) { dp[i] = []; trace[i] = []; }
    for (i = 0; i <= n; i++) { dp[i][0] = i * -1.1; trace[i][0] = 'ref'; }
    for (j = 0; j <= m; j++) { dp[0][j] = j * -0.3; trace[0][j] = 'hyp'; }
    trace[0][0] = 'none';

    for (i = 1; i <= n; i++) {
      for (j = 1; j <= m; j++) {
        var sim = similarity(ref[i - 1], hyp[j - 1]);
        var diagScore = sim >= 0.999 ? 2 : sim >= 0.55 ? 0.9 : -0.65;
        var diag = dp[i - 1][j - 1] + diagScore;
        var up = dp[i - 1][j] - 1.1;
        var left = dp[i][j - 1] - 0.3;
        var best = Math.max(diag, up, left);
        dp[i][j] = best;
        trace[i][j] = best === diag ? 'diag' : best === up ? 'ref' : 'hyp';
      }
    }

    var pairs = [];
    i = n; j = m;
    while (i > 0 || j > 0) {
      var t = trace[i][j];
      if (t === 'diag') {
        var sim2 = similarity(ref[i - 1], hyp[j - 1]);
        pairs.unshift({ ri: i - 1, hi: j - 1, type: sim2 >= 0.999 ? 'correct' : sim2 >= 0.55 ? 'near' : 'wrong', heard: hyp[j - 1] });
        i--; j--;
      } else if (t === 'ref') {
        pairs.unshift({ ri: i - 1, hi: -1, type: 'missing', heard: null });
        i--;
      } else {
        pairs.unshift({ ri: -1, hi: j - 1, type: 'extra', heard: hyp[j - 1] });
        j--;
      }
    }
    return pairs;
  }

  function buildWords(refWords, pairs) {
    var map = {};
    pairs.forEach(function (p) { if (p.ri >= 0) map[p.ri] = p; });
    return refWords.map(function (w, idx) {
      var p = map[idx] || { type: 'missing', heard: null };
      return { text: w, status: p.type, heard: p.heard };
    });
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function computeFluency(metrics, wordCount) {
    var ideal = Math.max(1.15, wordCount / 2.35);
    var duration = metrics.duration || ideal;
    var speedScore = clamp(1 - Math.abs(duration - ideal) / ideal * 0.85, 0, 1);
    var pauseCount = metrics.pauseCount || 0;
    var pauseSeconds = metrics.pauseSeconds || 0;
    var pauseScore = clamp(1 - pauseCount * 0.09 - Math.max(0, pauseSeconds - duration * 0.22) * 0.22, 0, 1);
    var volume = metrics.avgLevel || 0;
    var volumeScore = volume < 0.02 ? 0.35 : clamp(volume / 0.17, 0.35, 1);
    var fluency = 0.45 * speedScore + 0.3 * pauseScore + 0.25 * volumeScore;
    return {
      value: clamp(fluency, 0, 1),
      wpm: Math.round(wordCount / duration * 60),
      idealDuration: ideal,
      duration: duration,
      pauses: pauseCount,
      volume: volume
    };
  }

  function diagnose(sentence, words, fluency, isDemo) {
    var tips = [];
    var phonemes = (SB.data && SB.data.phonemes) || {};
    var problemCount = words.filter(function (w) { return w.status !== 'correct'; }).length;

    if (isDemo) {
      tips.push({ label: '体验评分', advice: '浏览器未返回语音识别结果，以下是模拟反馈。用 Chrome 打开本地地址并允许麦克风，即可获得真实逐词评分。', tone: 'info' });
    }

    var focus = sentence.focus || [];
    if (problemCount > 0 && focus.length) {
      var key = focus[0];
      if (phonemes[key]) tips.push({ label: phonemes[key].label, advice: phonemes[key].advice, tone: 'warn' });
      if (focus.length > 1 && phonemes[focus[1]] && tips.length < 3) {
        tips.push({ label: phonemes[focus[1]].label, advice: phonemes[focus[1]].advice, tone: 'warn' });
      }
    } else if (focus.length && phonemes[focus[0]]) {
      tips.push({ label: '保持得不错', advice: '这句的 ' + phonemes[focus[0]].label + ' 处理得挺稳，下一句试着把重音和意群连读做得更自然。', tone: 'good' });
    }

    if (fluency.pauses >= 3) {
      tips.push({ label: '停顿偏多', advice: '中间停顿 ' + fluency.pauses + ' 次。先按意群分组，一口气读完一组，别逐词蹦字。', tone: 'warn' });
    } else if (fluency.duration < fluency.idealDuration * 0.65) {
      tips.push({ label: '语速偏快', advice: '比参考节奏快了不少。把元音读饱满、句尾别急着收，清晰度会明显提升。', tone: 'warn' });
    } else if (fluency.duration > fluency.idealDuration * 1.7) {
      tips.push({ label: '语速偏慢', advice: '试着把相邻词连起来读，减少词与词之间的空隙。', tone: 'warn' });
    }
    if (fluency.volume < 0.05) {
      tips.push({ label: '声音偏小', advice: '靠近一点麦克风，用正常说话的音量朗读，识别会更准。', tone: 'warn' });
    }
    return tips.slice(0, 3);
  }

  function starsFor(total) { return total >= 88 ? 3 : total >= 72 ? 2 : total >= 55 ? 1 : 0; }
  function xpFor(total, isDemo) {
    var xp = total >= 90 ? 30 : total >= 75 ? 24 : total >= 60 ? 16 : 8;
    return isDemo ? Math.round(xp * 0.5) : xp;
  }
  function comboMultiplier(c) { return c >= 5 ? 2 : c >= 3 ? 1.5 : c >= 2 ? 1.2 : 1; }
  function rewardFor(total, isDemo, prevCombo) {
    var combo = total >= 80 ? (prevCombo || 0) + 1 : 0;
    var multiplier = comboMultiplier(combo);
    var baseXp = xpFor(total, isDemo);
    var xp = Math.round(baseXp * multiplier);
    return { xp: xp, baseXp: baseXp, combo: combo, multiplier: multiplier, comboBonus: xp - baseXp };
  }

  function hashCode(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  function demoResult(sentence, metrics, prevCombo) {
    var refWords = tokenize(sentence.en);
    var seed = hashCode(sentence.id + '|' + Date.now());
    var total = 74 + (seed % 20);
    if ((metrics.avgLevel || 0) < 0.05) total -= 6;
    if ((metrics.duration || 3) < 1.2) total -= 7;
    total = clamp(total, 52, 96);
    var badIndex = seed % Math.max(1, refWords.length);
    var secondBad = (seed >> 4) % Math.max(1, refWords.length);
    var words = refWords.map(function (w, i) {
      if (i === badIndex) return { text: w, status: 'near', heard: w };
      if (i === secondBad && total < 82) return { text: w, status: 'missing', heard: null };
      return { text: w, status: 'correct', heard: w };
    });
    var accuracy = clamp(total / 100 + 0.04, 0, 1);
    var completeness = clamp(total / 100 + 0.02, 0, 1);
    var fluency = computeFluency(metrics, refWords.length);
    var result = {
      total: total, accuracy: accuracy, fluency: clamp(total / 100 - 0.02, 0, 1),
      completeness: completeness, stars: starsFor(total),
      words: words, transcript: '', alternatives: [],
      fluencyDetail: fluency, diagnose: diagnose(sentence, words, fluency, true),
      demo: true, sentence: sentence,
      metrics: metrics,
      reward: rewardFor(total, true, prevCombo)
    };
    result.xp = result.reward.xp;
    result.combo = result.reward.combo;
    result.multiplier = result.reward.multiplier;
    result.comboBonus = result.reward.comboBonus;
    return result;
  }

  /**
   * 评分主入口
   * @param {object} input {sentence, transcript, alternatives, metrics}
   */
  function score(input) {
    var sentence = input.sentence;
    var metrics = input.metrics || {};
    var refWords = tokenize(sentence.en);

    var candidates = (input.alternatives || []).slice();
    if (input.transcript && candidates.indexOf(input.transcript) === -1) candidates.unshift(input.transcript);
    candidates = candidates.filter(function (c) { return normalize(c).length > 0; });

    if (!candidates.length) return demoResult(sentence, metrics, input.combo);

    var best = null;
    candidates.forEach(function (candidate) {
      var pairs = align(refWords, tokenize(candidate));
      var words = buildWords(refWords, pairs);
      var gained = 0;
      words.forEach(function (w) {
        gained += w.status === 'correct' ? 1 : w.status === 'near' ? 0.65 : w.status === 'wrong' ? 0.2 : 0;
      });
      var acc = refWords.length ? gained / refWords.length : 0;
      if (!best || acc > best.accuracy) {
        best = { accuracy: acc, words: words, pairs: pairs, transcript: candidate };
      }
    });

    var missing = best.words.filter(function (w) { return w.status === 'missing'; }).length;
    var extra = best.pairs.filter(function (p) { return p.type === 'extra'; }).length;
    var completeness = clamp(1 - missing / refWords.length - Math.min(0.15, extra * 0.05), 0, 1);
    var fluency = computeFluency(metrics, refWords.length);

    var total = Math.round(100 * (0.52 * best.accuracy + 0.24 * fluency.value + 0.24 * completeness));
    total = clamp(total, 35, 99);

    var result = {
      total: total,
      accuracy: best.accuracy,
      fluency: fluency.value,
      completeness: completeness,
      stars: starsFor(total),
      words: best.words,
      transcript: best.transcript,
      alternatives: candidates,
      fluencyDetail: fluency,
      diagnose: diagnose(sentence, best.words, fluency, false),
      demo: false,
      sentence: sentence,
      metrics: metrics,
      reward: rewardFor(total, false, input.combo)
    };
    result.xp = result.reward.xp;
    result.combo = result.reward.combo;
    result.multiplier = result.reward.multiplier;
    result.comboBonus = result.reward.comboBonus;
    return result;
  }

  SB.scoring = {
    score: score,
    normalize: normalize,
    tokenize: tokenize,
    align: align,
    similarity: similarity,
    starsFor: starsFor
  };
})(window);
