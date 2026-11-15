/* SpeakBuddy - 入学定级测评：自适应跟读 + 理解选择题 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  /* 跟读题库：每级 3 句，难度体现在句长、从句与弱读上。 */
  var SPEAKING = [
    { id: 'as1', level: 1, en: 'Good morning, how are you?', zh: '早上好，你好吗？', key: 'morning', ipa: '/ˈmɔːnɪŋ/', focus: ['ŋ', 'intonation'], tip: 'morning 词尾是后鼻音 /ŋ/；寒暄时句尾轻轻上扬。' },
    { id: 'as2', level: 1, en: 'I would like a cup of tea.', zh: '我想要一杯茶。', key: 'would', ipa: '/wʊd/', focus: ['w', 'linking'], tip: 'would like 自然连读，would 的 /w/ 要圆唇。' },
    { id: 'as3', level: 1, en: 'Can you tell me the time, please?', zh: '能告诉我现在几点吗？', key: 'tell', ipa: '/tel/', focus: ['l', 'ə'], tip: 'tell me 别断开，词尾暗 l 舌尖抵住上齿龈。' },
    { id: 'as4', level: 2, en: 'I have been working here for three years.', zh: '我在这里工作三年了。', key: 'working', ipa: '/ˈwɜːkɪŋ/', focus: ['ŋ', 'ə'], tip: 'have been 弱读，working 词尾 /ŋ/ 别读成 /n/。' },
    { id: 'as5', level: 2, en: 'Could you explain how this process works?', zh: '能解释一下这个流程怎么运作吗？', key: 'explain', ipa: '/ɪkˈspleɪn/', focus: ['ɪ', 'stress'], tip: 'explain 重音在第二音节，整句按意群一口气读完。' },
    { id: 'as6', level: 2, en: 'We need to move the deadline to next Friday.', zh: '我们得把截止日挪到下周五。', key: 'deadline', ipa: '/ˈdedlaɪn/', focus: ['stress', 'linking'], tip: 'deadline 重音在首音节，need to 可以连读成 /niːdə/。' },
    { id: 'as7', level: 3, en: 'I would argue that the benefits outweigh the risks.', zh: '我认为收益大于风险。', key: 'outweigh', ipa: '/ˌaʊtˈweɪ/', focus: ['w', 'stress'], tip: 'outweigh 重音在第二音节，/w/ 起音要圆唇。' },
    { id: 'as8', level: 3, en: 'Had I known earlier, I would have handled it differently.', zh: '要是早知道，我会换一种处理方式。', key: 'would have', ipa: '/wʊd əv/', focus: ['ə', 'linking'], tip: '倒装虚拟语气；would have 口语里弱读成 /wʊdəv/。' },
    { id: 'as9', level: 3, en: 'The proposal is contingent on further validation.', zh: '该提案取决于进一步验证。', key: 'contingent', ipa: '/kənˈtɪndʒənt/', focus: ['ə', 'stress'], tip: 'contingent 重音在 -tin-，首音节弱读；句尾平稳下降。' }
  ];

  /* 理解题：词汇 / 语法 / 语用，快速校准真实水平（不依赖麦克风）。 */
  var CHOICES = [
    { id: 'aq1', level: 1, q: '___ you like some coffee?', options: ['Would', 'Do', 'Are'], answer: 0, explain: '委婉地提供或邀请，用 Would you like…?' },
    { id: 'aq2', level: 1, q: 'She ___ to work by bus every day.', options: ['go', 'goes', 'going'], answer: 1, explain: '第三人称单数的一般现在时，动词加 -es。' },
    { id: 'aq3', level: 2, q: 'I ___ in this team since 2022.', options: ['work', 'am working', 'have been working'], answer: 2, explain: 'since + 时间点，用现在完成进行时表示持续到现在的动作。' },
    { id: 'aq4', level: 2, q: '“Could we take a rain check?” 最贴近的意思是：', options: ['能改天吗', '能便宜点吗', '能查一下天气吗'], answer: 0, explain: 'rain check 指「这次不行，改天再约」的委婉说法。' },
    { id: 'aq5', level: 3, q: '___ the results, we decided to pivot.', options: ['Given', 'Giving', 'To give'], answer: 0, explain: 'Given 作介词表示「考虑到」，相当于 Considering。' },
    { id: 'aq6', level: 3, q: '“contingent on” 最接近：', options: ['取决于', '独立于', '优先于'], answer: 0, explain: 'contingent on = dependent on，取决于某个条件。' }
  ];

  var LEVELS = {
    1: {
      label: 'A2 · 初级起步', en: 'Starter', short: '初级', startStage: 1, color: '#14B8A6', tint: '#E5F8F5',
      desc: '能应付简单寒暄和高频短句，但连读、长句和词尾辅音还容易卡。',
      advice: '路线从初级开始：先把音发准、把句子读完整，再一级一级往上走。',
      routeHint: '三段完整保留，初级为主线，中级与高级作为进阶目标。'
    },
    2: {
      label: 'B1 · 中级进阶', en: 'Intermediate', short: '中级', startStage: 2, color: '#635BFF', tint: '#F0EEFF',
      desc: '日常沟通基本没问题，长句的连贯性、重音节奏和场景词汇还有提升空间。',
      advice: '初级段变成可选热身，主线从中级开始，重点练意群连读和表达清晰度。',
      routeHint: '跳过初级主线，从中级起步；初级关卡全部开放，随时可以回头补。'
    },
    3: {
      label: 'B2 · 高级精修', en: 'Advanced', short: '高级', startStage: 3, color: '#F0842C', tint: '#FFF1E4',
      desc: '已经能成段表达，剩下的是分寸感、观点组织和专业场景的地道度。',
      advice: '起点直接放在高级段，初中级内容全部开放作为复习，路线更聚焦、更省时间。',
      routeHint: '只把高级段作为主线，初中级 12 关全部开放为可选复习。'
    }
  };

  var SPEAKING_COUNT = 4;
  var CHOICE_COUNT = 2;

  function makeState() {
    return {
      answers: [],
      currentLevel: 2, // 从中级起步，按表现上下自适应
      usedSpeaking: [],
      choiceQueue: null,
      demo: false
    };
  }

  function poolFor(level) {
    return SPEAKING.filter(function (x) { return x.level === level; });
  }

  function pickSpeaking(a) {
    var pool = poolFor(a.currentLevel).filter(function (x) { return a.usedSpeaking.indexOf(x.id) === -1; });
    if (!pool.length) {
      // 当前难度用完，退到最近的可用难度
      var order = [a.currentLevel, a.currentLevel - 1, a.currentLevel + 1, 1, 2, 3];
      for (var i = 0; i < order.length; i++) {
        if (order[i] < 1 || order[i] > 3) continue;
        var alt = poolFor(order[i]).filter(function (x) { return a.usedSpeaking.indexOf(x.id) === -1; });
        if (alt.length) { pool = alt; break; }
      }
    }
    return pool[Math.floor(Math.random() * pool.length)] || SPEAKING[0];
  }

  function buildChoiceQueue(a) {
    var sp = a.answers.filter(function (x) { return x.type === 'speaking'; });
    var avg = sp.length ? sp.reduce(function (s, x) { return s + x.score; }, 0) / sp.length : 70;
    var levels;
    if (avg >= 78 || a.currentLevel >= 3) levels = [2, 3];
    else if (avg < 62 || a.currentLevel <= 1) levels = [1, 2];
    else levels = [2, 2];
    var queue = [];
    levels.forEach(function (lv, i) {
      var pool = CHOICES.filter(function (x) { return x.level === lv && queue.indexOf(x) === -1; });
      var item = pool[i % Math.max(1, pool.length)] || CHOICES[0];
      if (queue.indexOf(item) === -1) queue.push(item);
      else {
        var other = CHOICES.filter(function (x) { return queue.indexOf(x) === -1; })[0];
        if (other) queue.push(other);
      }
    });
    while (queue.length < CHOICE_COUNT) queue.push(CHOICES[queue.length]);
    return queue.slice(0, CHOICE_COUNT);
  }

  /** 取当前题目；返回 null 表示测评结束。 */
  function nextItem(a) {
    var n = a.answers.length;
    var total = SPEAKING_COUNT + CHOICE_COUNT;
    if (n >= total) return null;
    var index = n + 1;
    if (n < SPEAKING_COUNT) {
      var sentence = pickSpeaking(a);
      return { type: 'speaking', sentence: sentence, level: sentence.level, index: index, total: total };
    }
    if (!a.choiceQueue) a.choiceQueue = buildChoiceQueue(a);
    var item = a.choiceQueue[n - SPEAKING_COUNT];
    return { type: 'choice', item: item, level: item.level, index: index, total: total };
  }

  function applySpeaking(a, item, result) {
    a.answers.push({
      type: 'speaking', id: item.sentence.id, level: item.level,
      score: result.total, demo: !!result.demo
    });
    if (result.demo) a.demo = true;
    if (result.total >= 82) a.currentLevel = Math.min(3, a.currentLevel + 1);
    else if (result.total < 62) a.currentLevel = Math.max(1, a.currentLevel - 1);
    a.usedSpeaking.push(item.sentence.id);
    return a.currentLevel;
  }

  function applyChoice(a, item, chosen) {
    var correct = chosen === item.item.answer;
    a.answers.push({ type: 'choice', id: item.item.id, level: item.level, correct: correct, score: correct ? 100 : 0 });
    return { correct: correct, answer: item.item.answer, explain: item.item.explain };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** 定级：跟读与理解加权；体验评分不可靠时降低跟读权重并如实标注。 */
  function grade(a) {
    var sp = a.answers.filter(function (x) { return x.type === 'speaking'; });
    var ch = a.answers.filter(function (x) { return x.type === 'choice'; });
    var spAvg = sp.length ? sp.reduce(function (s, x) { return s + x.score; }, 0) / sp.length : 70;
    var chRate = ch.length ? ch.filter(function (x) { return x.correct; }).length / ch.length : 0;
    var demo = a.demo || sp.some(function (x) { return x.demo; });
    var spWeight = demo ? 0.35 : 0.65;
    var maxLevel = sp.length ? Math.max.apply(null, sp.map(function (x) { return x.level; })) : 1;
    // 自适应难度是基于跟读得分爬升的；体验评分不可信，此时不给难度加成
    var bonus = demo ? 0 : (maxLevel - 1) * 5;
    var raw = clamp(Math.round(spWeight * spAvg + (1 - spWeight) * chRate * 100 + bonus), 0, 99);
    // 没有真实发音数据时，仅凭两道理解题不足以判定高级，保守封顶中级，避免一下跳过 12 关
    var capped = demo && raw >= 78;
    var score = capped ? 77 : raw;
    var level = score >= 78 ? 3 : score >= 55 ? 2 : 1;
    var meta = LEVELS[level];
    return {
      score: score,
      level: level,
      label: meta.label,
      en: meta.en,
      short: meta.short,
      startStage: meta.startStage,
      color: meta.color,
      tint: meta.tint,
      desc: meta.desc,
      advice: meta.advice,
      routeHint: meta.routeHint,
      speaking: Math.round(spAvg),
      choice: Math.round(chRate * 100),
      demo: demo,
      capped: capped,
      date: Date.now()
    };
  }

  SB.assessment = {
    speaking: SPEAKING,
    choices: CHOICES,
    levels: LEVELS,
    speakingCount: SPEAKING_COUNT,
    choiceCount: CHOICE_COUNT,
    total: SPEAKING_COUNT + CHOICE_COUNT,
    makeState: makeState,
    nextItem: nextItem,
    applySpeaking: applySpeaking,
    applyChoice: applyChoice,
    grade: grade
  };
})(window);
