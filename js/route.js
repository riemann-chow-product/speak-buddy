/* SpeakBuddy - 兴趣话题 → 个性化学习路线 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  /* 内置话题。keywords 用于把用户自定义输入映射到最接近的话题。 */
  var TOPICS = [
    { id: 'travel', label: '旅行出行', en: 'Travel', desc: '机场、酒店、问路', icon: 'globe', color: '#0EA5A4', tint: '#E3F7F4', keywords: ['旅行', '旅游', '出行', '机场', '酒店', '出国', '度假', '出差', 'trip', 'travel', 'flight', 'hotel'] },
    { id: 'work', label: '职场沟通', en: 'At Work', desc: '会议、汇报、协作', icon: 'briefcase', color: '#F0842C', tint: '#FFF1E4', keywords: ['职场', '工作', '上班', '会议', '同事', '汇报', '项目', '远程', 'work', 'office', 'meeting', 'team'] },
    { id: 'daily', label: '日常生活', en: 'Daily Life', desc: '点单、购物、办事', icon: 'home', color: '#635BFF', tint: '#F0EEFF', keywords: ['生活', '日常', '购物', '点单', '快递', '银行', '办事', '咖啡', 'daily', 'life', 'shopping'] },
    { id: 'social', label: '社交聚会', en: 'Social', desc: '寒暄、邀约、表达感受', icon: 'chat', color: '#8B5CF6', tint: '#F3EDFF', keywords: ['社交', '聚会', '朋友', '聊天', '邀请', '感受', '人情', '派对', 'social', 'friend', 'party'] },
    { id: 'campus', label: '校园学习', en: 'Campus', desc: '课堂、小组、考试', icon: 'book', color: '#2F7DE1', tint: '#E9F2FF', keywords: ['校园', '学校', '学习', '上课', '考试', '图书馆', '留学', '学生', 'campus', 'study', 'school', 'exam'] },
    { id: 'career', label: '面试求职', en: 'Career', desc: '自我介绍、谈优势', icon: 'trophy', color: '#E2508A', tint: '#FFEDF4', keywords: ['面试', '求职', '简历', '跳槽', '找工作', '职业规划', '实习', 'career', 'interview', 'job', 'resume'] },
    { id: 'health', label: '健康医疗', en: 'Health', desc: '看诊、症状、用药', icon: 'heart', color: '#16A34A', tint: '#E8F7EE', keywords: ['健康', '医疗', '看病', '医生', '身体', '生病', '运动', '健身', 'health', 'doctor', 'medical', 'fitness'] },
    { id: 'food', label: '美食咖啡', en: 'Food & Coffee', desc: '点餐、口味、结账', icon: 'coffee', color: '#B45309', tint: '#FFF3E3', keywords: ['美食', '咖啡', '餐厅', '吃饭', '点餐', '甜点', 'food', 'coffee', 'restaurant', 'cafe'] },
    { id: 'tech', label: '科技与 AI', en: 'Tech & AI', desc: '产品、工具、线上协作', icon: 'code', color: '#334155', tint: '#EDF1F7', keywords: ['科技', '互联网', '人工智能', '编程', '产品', '数码', 'ai', 'tech', 'code', 'software', 'product'] },
    { id: 'opinion', label: '观点表达', en: 'Opinions', desc: '委婉拒绝、说出看法', icon: 'sparkle', color: '#DB2777', tint: '#FFEAF3', keywords: ['观点', '表达', '看法', '辩论', '讨论', '拒绝', '沟通技巧', 'opinion', 'debate', 'idea'] }
  ];

  /* 每关的话题标签，顺序代表相关度（第一个权重更高）。 */
  var LESSON_TOPICS = {
    l1: ['social', 'daily', 'travel'],
    l2: ['social', 'daily', 'career'],
    l3: ['daily', 'social', 'opinion'],
    l4: ['food', 'daily', 'travel'],
    l5: ['travel', 'daily'],
    l6: ['daily', 'food', 'travel'],
    l7: ['work', 'career', 'tech'],
    l8: ['work', 'opinion', 'career'],
    l9: ['work', 'tech', 'career'],
    l10: ['travel', 'daily'],
    l11: ['travel', 'daily'],
    l12: ['opinion', 'social', 'work'],
    l13: ['campus', 'work', 'daily'],
    l14: ['campus', 'work', 'tech'],
    l15: ['campus', 'daily'],
    l16: ['social', 'daily'],
    l17: ['social', 'opinion'],
    l18: ['social', 'opinion'],
    l19: ['health', 'daily'],
    l20: ['daily', 'health'],
    l21: ['daily', 'health', 'work'],
    l22: ['career', 'work'],
    l23: ['career', 'work', 'opinion'],
    l24: ['work', 'tech', 'career']
  };

  /* 难度分层：按句子长度、词汇与表达复杂度划分，每段 8 关。 */
  var LEVELS = {
    1: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l16', 'l17'],
    2: ['l7', 'l8', 'l9', 'l10', 'l11', 'l13', 'l14', 'l15'],
    3: ['l12', 'l18', 'l19', 'l20', 'l21', 'l22', 'l23', 'l24']
  };

  var STAGES = [
    { level: 1, key: 'basic', title: '初级 · 开口敢说', en: 'Start Speaking', desc: '高频短句和日常寒暄，先把嘴打开、把音发准。', color: '#14B8A6', tint: '#E5F8F5', icon: 'sparkle', minStars: 0 },
    { level: 2, key: 'intermediate', title: '中级 · 说得清楚', en: 'Speak Clearly', desc: '更长的句子和真实场景，练连贯表达与意群连读。', color: '#635BFF', tint: '#F0EEFF', icon: 'target', minStars: 6 },
    { level: 3, key: 'advanced', title: '高级 · 说得地道', en: 'Speak Naturally', desc: '观点、分寸感与专业场景，把英语说得像一段话。', color: '#F0842C', tint: '#FFF1E4', icon: 'trophy', minStars: 15 }
  ];

  function findTopic(id) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i];
    return null;
  }

  function unique(arr) {
    var out = [];
    arr.forEach(function (x) { if (x && out.indexOf(x) === -1) out.push(x); });
    return out;
  }

  /** 把自定义话题文本映射到内置话题；匹配不到时保留原文，诚实提示「课程规划中」。 */
  function matchCustom(text) {
    var t = String(text || '').trim().toLowerCase();
    if (t.length < 2) return [];
    var hits = [];
    TOPICS.forEach(function (topic) {
      for (var i = 0; i < topic.keywords.length; i++) {
        var k = topic.keywords[i].toLowerCase();
        if (k.length >= 2 && (t.indexOf(k) !== -1 || k.indexOf(t) !== -1)) {
          hits.push(topic.id);
          return;
        }
      }
    });
    return unique(hits);
  }

  function resolveInterests(interests) {
    var topicIds = [], labels = [], unmatched = [], mapped = [];
    (interests || []).forEach(function (it) {
      if (it.custom) {
        var name = String(it.label || '').trim();
        if (!name) return;
        var hits = matchCustom(name);
        labels.push(name);
        if (hits.length) {
          hits.forEach(function (id) { topicIds.push(id); });
          mapped.push({ label: name, topics: hits });
        } else {
          unmatched.push(name);
        }
      } else {
        var topic = findTopic(it.id);
        if (topic) { topicIds.push(topic.id); labels.push(topic.label); }
      }
    });
    return { topicIds: unique(topicIds), labels: unique(labels), unmatched: unique(unmatched), mapped: mapped };
  }

  function scoreLesson(lessonId, topicIds) {
    var tags = LESSON_TOPICS[lessonId] || [];
    var hits = tags.filter(function (t) { return topicIds.indexOf(t) !== -1; });
    var score = hits.length * 12;
    if (hits.length) score += 4;
    if (tags[0] && topicIds.indexOf(tags[0]) !== -1) score += 6; // 首要话题加权
    return { score: score, recommended: hits.length > 0 };
  }

  /** 生成三段路线：按兴趣匹配度排序，并按测评级别决定主线起点；起点之前的阶段变成可选热身。 */
  function buildRoute(interests, placement) {
    var resolved = resolveInterests(interests);
    var topicIds = resolved.topicIds.length
      ? resolved.topicIds
      : ['daily', 'travel', 'social']; // 兜底：通用高频路线
    var startStage = (placement && placement.startStage) || 2; // 未测评时默认从中级开始

    var stages = STAGES.map(function (meta) {
      var pool = LEVELS[meta.level].slice();
      var scored = pool.map(function (id) {
        var s = scoreLesson(id, topicIds);
        return { id: id, score: s.score, recommended: s.recommended, index: SB.data.getLesson(id).index };
      });
      scored.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
      var picked = scored.slice(0, 6);
      if (picked.length < 3) picked = scored.slice(0, 3);
      var result = {};
      Object.keys(meta).forEach(function (k) { result[k] = meta[k]; });
      result.lessons = picked.map(function (x) { return x.id; });
      result.recommended = picked.filter(function (x) { return x.recommended; }).map(function (x) { return x.id; });
      result.total = picked.length;
      result.status = meta.level < startStage ? 'warmup' : meta.level === startStage ? 'current' : 'future';
      result.optional = result.status === 'warmup';
      return result;
    });

    /* 主线 = 起点及之后的阶段；起点之前的关卡全部开放为可选热身，并挑 3 关放进主线末尾做巩固复习。 */
    var order = [], warmupIds = [];
    stages.forEach(function (s) {
      if (s.optional) s.lessons.forEach(function (id) { warmupIds.push(id); });
      else s.lessons.forEach(function (id) { order.push(id); });
    });
    warmupIds.sort(function (a, b) {
      return scoreLesson(b, topicIds).score - scoreLesson(a, topicIds).score;
    });
    var reviewIds = warmupIds.slice(0, Math.min(3, warmupIds.length));
    reviewIds.forEach(function (id) { order.push(id); });

    return {
      version: 2,
      interests: (interests || []).slice(),
      topicIds: topicIds,
      labels: resolved.labels,
      unmatched: resolved.unmatched,
      mapped: resolved.mapped,
      startStage: startStage,
      placement: placement || null,
      stages: stages,
      order: order,
      warmupIds: warmupIds,
      reviewIds: reviewIds,
      createdAt: Date.now()
    };
  }

  function stageOf(lessonId) {
    var keys = Object.keys(LEVELS);
    for (var i = 0; i < keys.length; i++) {
      if (LEVELS[keys[i]].indexOf(lessonId) !== -1) return parseInt(keys[i], 10);
    }
    return 1;
  }

  function title(route) {
    if (!route || !route.labels || !route.labels.length) return '通用口语路线';
    return route.labels.slice(0, 2).join(' · ') + (route.labels.length > 2 ? ' 等' : '') + ' 专属路线';
  }

  SB.route = {
    topics: TOPICS,
    stages: STAGES,
    lessonTopics: LESSON_TOPICS,
    levels: LEVELS,
    findTopic: findTopic,
    matchCustom: matchCustom,
    resolve: resolveInterests,
    build: buildRoute,
    stageOf: stageOf,
    title: title
  };
  SB.data.topics = TOPICS;
})(window);
