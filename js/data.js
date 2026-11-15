/* SpeakBuddy - 课程内容与音素知识库 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  /* 常见发音难点：用于练习提示与评分后的诊断建议 */
  var phonemes = {
    'iː': { label: '长元音 /iː/', advice: '嘴角向两侧拉开，把音拖足。see / meet / feel 都是长音，别读成短促的 /ɪ/。' },
    'ɪ': { label: '短元音 /ɪ/', advice: '放松嘴唇、短促收尾。sit 的 /ɪ/ 比 seat 的 /iː/ 短，不要拖长。' },
    'æ': { label: '梅花音 /æ/', advice: '嘴张大、下巴下压，舌位靠前。cat / bad / have 都不是 /e/。' },
    'θ': { label: '咬舌清音 /θ/', advice: '舌尖轻放在上下齿之间送气，think / thank / three 不要读成 /s/。' },
    'ð': { label: '咬舌浊音 /ð/', advice: '舌尖同样轻触牙齿，但声带要振动。this / the / weather 别读成 /z/ 或 /d/。' },
    'v': { label: '唇齿音 /v/', advice: '上齿轻咬下唇并振动声带。very / have / five 不要读成 /w/。' },
    'w': { label: '圆唇音 /w/', advice: '双唇收圆再快速放开，would / work / walk 的起音要有明显圆唇。' },
    'r': { label: '卷舌音 /r/', advice: '舌尖上卷但不触碰上颚，双唇略收圆，right / really 不要读成 /l/。' },
    'l': { label: '舌侧音 /l/', advice: '舌尖抵住上齿龈，气流从两侧出来。词尾的 l 要有"暗 l"的收尾。' },
    'ə': { label: '弱读 /ə/', advice: '非重读音节要轻、要短，about / today / the 里的元音别读满。' },
    'ʃ': { label: '清擦音 /ʃ/', advice: '双唇略前突、舌面靠近硬颚，she / should / station 别读成 /s/。' },
    'tʃ': { label: '破擦音 /tʃ/', advice: '先爆破再摩擦，check / question / much 要连成一个音。' },
    'ŋ': { label: '后鼻音 /ŋ/', advice: '舌根抬起抵软颚，going / thing / learning 的尾音不要读成 /n/。' },
    's': { label: '词尾 /s/ 与 /z/', advice: '注意名词复数与第三人称单数的词尾辅音，别把词尾整个吞掉。' },
    'linking': { label: '连读与意群', advice: '辅音结尾 + 元音开头时自然连读，按意群一口气读完，不要逐词蹦字。' },
    'intonation': { label: '句尾语调', advice: '一般疑问句句尾上扬，陈述句与特殊疑问句句尾下降，别用平调念完整句。' },
    'stress': { label: '单词重音', advice: '多音节词找准重音位置，重读音节更长更响，非重读音节要弱化。' }
  };

  /* 8 个单元 / 24 个关卡 / 72 个跟读句子 */
  var units = [
    {
      id: 'u1', index: '01', title: '破冰 · 初次见面', en: 'Greetings & Small Talk',
      desc: '从问候到自我介绍，让开口的第一分钟不再卡壳。',
      color: '#6C5CE7', tint: '#F1EEFF',
      lessons: [
        {
          id: 'l1', title: '打招呼', en: 'Saying Hello', xp: 30,
          sentences: [
            { id: 'l1-s1', en: 'Nice to meet you.', zh: '很高兴认识你。', key: 'meet', ipa: '/miːt/', focus: ['iː', 'linking'], tip: 'meet 是长音 /iː/，把音拖够；meet you 可以连读成 /miːtʃu/。' },
            { id: 'l1-s2', en: 'Where are you from?', zh: '你从哪里来？', key: 'where', ipa: '/weər/', focus: ['w', 'intonation'], tip: 'where 起音双唇要收圆；特殊疑问句句尾语调下降。' },
            { id: 'l1-s3', en: "I'm from Shanghai, China.", zh: '我来自中国上海。', key: 'China', ipa: '/ˈtʃaɪnə/', focus: ['tʃ', 'ə', 'stress'], tip: 'China 重音在第一个音节，词尾 -a 弱读成 /ə/。' }
          ]
        },
        {
          id: 'l2', title: '自我介绍', en: 'Introducing Yourself', xp: 35,
          sentences: [
            { id: 'l2-s1', en: 'My name is Alex.', zh: '我叫 Alex。', key: 'name', ipa: '/neɪm/', focus: ['linking', 'stress'], tip: 'name is 连起来读，重音落在 name 上。' },
            { id: 'l2-s2', en: 'I work in product design.', zh: '我做产品设计。', key: 'work', ipa: '/wɜːk/', focus: ['w', 'ə'], tip: 'work 别读成 walk；in 弱读，一带而过。' },
            { id: 'l2-s3', en: "I've been learning English for two years.", zh: '我学英语两年了。', key: 'learning', ipa: '/ˈlɜːnɪŋ/', focus: ['ŋ', 'linking'], tip: 'learning 词尾是后鼻音 /ŋ/，整句按意群一口气读完。' }
          ]
        },
        {
          id: 'l3', title: '聊聊天气', en: 'Small Talk About Weather', xp: 35,
          sentences: [
            { id: 'l3-s1', en: "It's a lovely day today.", zh: '今天天气真好。', key: 'lovely', ipa: '/ˈlʌvli/', focus: ['v', 'l'], tip: 'lovely 里的 v 要咬下唇；别把 l 和 v 混在一起。' },
            { id: 'l3-s2', en: 'Is it going to rain later?', zh: '待会儿会下雨吗？', key: 'going', ipa: '/ˈɡəʊɪŋ/', focus: ['ŋ', 'intonation'], tip: '一般疑问句句尾上扬；going to 口语中常连读成 gonna。' },
            { id: 'l3-s3', en: 'I hope the weather stays like this.', zh: '我希望天气一直这样。', key: 'the', ipa: '/ðə/', focus: ['ð', 'linking'], tip: 'the 在辅音前弱读 /ðə/，舌尖轻触牙齿并振动声带。' }
          ]
        }
      ]
    },
    {
      id: 'u2', index: '02', title: '生活 · 出门在外', en: 'Daily Life',
      desc: '点单、问路、购物，把课本句子变成能用的口语。',
      color: '#0EA5A4', tint: '#E6F8F6',
      lessons: [
        {
          id: 'l4', title: '点一杯咖啡', en: 'Ordering Coffee', xp: 40,
          sentences: [
            { id: 'l4-s1', en: 'Could I have a latte, please?', zh: '请给我一杯拿铁好吗？', key: 'could', ipa: '/kʊd/', focus: ['ɪ', 'linking'], tip: 'Could I 连读成 /kʊdaɪ/，语气保持柔和上扬。' },
            { id: 'l4-s2', en: 'Would you like it hot or iced?', zh: '您要热的还是冰的？', key: 'would', ipa: '/wʊd/', focus: ['w', 'intonation'], tip: '选择疑问句前半句上扬、后半句下降。' },
            { id: 'l4-s3', en: 'Can I pay by card?', zh: '可以刷卡吗？', key: 'card', ipa: '/kɑːd/', focus: ['æ', 'intonation'], tip: 'card 是 /ɑː/ 不是 /æ/；一般疑问句句尾上扬。' }
          ]
        },
        {
          id: 'l5', title: '问路与指路', en: 'Asking for Directions', xp: 40,
          sentences: [
            { id: 'l5-s1', en: 'Excuse me, where is the nearest station?', zh: '打扰一下，最近的车站在哪？', key: 'nearest', ipa: '/ˈnɪərɪst/', focus: ['ɪ', 'ə'], tip: '句首 Excuse me 要轻快，重音落在 nearest 和 station。' },
            { id: 'l5-s2', en: 'Go straight and turn left at the corner.', zh: '直走，在路口左转。', key: 'straight', ipa: '/streɪt/', focus: ['linking', 'l'], tip: 'turn left 中 left 的 /l/ 要清晰，词尾 /t/ 别吞掉。' },
            { id: 'l5-s3', en: "It's about a five-minute walk.", zh: '大概走五分钟。', key: 'five', ipa: '/faɪv/', focus: ['v', 'linking'], tip: 'five 词尾 /v/ 咬下唇；about a 连读。' }
          ]
        },
        {
          id: 'l6', title: '逛店购物', en: 'Shopping', xp: 45,
          sentences: [
            { id: 'l6-s1', en: 'How much does this cost?', zh: '这个多少钱？', key: 'this', ipa: '/ðɪs/', focus: ['ð', 'ɪ'], tip: 'this 用浊音 /ð/ 开头，别读成 /dɪs/。' },
            { id: 'l6-s2', en: 'Do you have this in a larger size?', zh: '这个有大一号的吗？', key: 'larger', ipa: '/ˈlɑːdʒə/', focus: ['l', 'ə'], tip: 'larger 重音在首音节，词尾 -er 弱读。' },
            { id: 'l6-s3', en: "I'll take it, thank you.", zh: '我买了，谢谢。', key: 'thank', ipa: '/θæŋk/', focus: ['θ', 'æ'], tip: 'thank 的 /θ/ 舌尖要露出来，/æ/ 嘴巴张大。' }
          ]
        }
      ]
    },
    {
      id: 'u3', index: '03', title: '职场 · 会议表达', en: 'At Work',
      desc: '会议开场、表达观点、跟进进度，说得更专业也更自然。',
      color: '#F0842C', tint: '#FFF1E4',
      lessons: [
        {
          id: 'l7', title: '会议开场', en: 'Starting a Meeting', xp: 45,
          sentences: [
            { id: 'l7-s1', en: "Let's get started, shall we?", zh: '我们开始吧，好吗？', key: 'started', ipa: '/ˈstɑːtɪd/', focus: ['stress', 'intonation'], tip: "Let's 的 /ts/ 收干净；反意疑问句尾上扬。" },
            { id: 'l7-s2', en: "Today we'll go through the latest numbers.", zh: '今天我们过一下最新数据。', key: 'through', ipa: '/θruː/', focus: ['θ', 'linking'], tip: 'through 是咬舌音 /θ/，别读成 /sruː/。' },
            { id: 'l7-s3', en: 'Please feel free to jump in anytime.', zh: '随时欢迎打断补充。', key: 'feel', ipa: '/fiːl/', focus: ['iː', 'l'], tip: 'feel 的长音 /iː/ 拖足，词尾暗 l 舌头要抵上齿龈。' }
          ]
        },
        {
          id: 'l8', title: '表达观点', en: 'Sharing Opinions', xp: 50,
          sentences: [
            { id: 'l8-s1', en: "From my point of view, it's worth trying.", zh: '在我看来，这值得一试。', key: 'worth', ipa: '/wɜːθ/', focus: ['w', 'θ'], tip: 'worth 结尾是 /θ/，先圆唇 /w/ 起音，再咬舌收尾。' },
            { id: 'l8-s2', en: 'I see your point, but I have a concern.', zh: '我明白你的意思，但我有点顾虑。', key: 'concern', ipa: '/kənˈsɜːn/', focus: ['ə', 'stress'], tip: 'concern 重音在第二音节，首音节弱读成 /kən/。' },
            { id: 'l8-s3', en: 'Could you walk me through the details?', zh: '能带我过一遍细节吗？', key: 'walk', ipa: '/wɔːk/', focus: ['w', 'linking'], tip: 'walk through 之间别硬停顿；details 重音在首音节。' }
          ]
        },
        {
          id: 'l9', title: '跟进进度', en: 'Following Up', xp: 50,
          sentences: [
            { id: 'l9-s1', en: 'Where are we on the timeline?', zh: '进度到哪一步了？', key: 'timeline', ipa: '/ˈtaɪmlaɪn/', focus: ['stress', 'intonation'], tip: 'timeline 重音在首音节，特殊疑问句尾下降。' },
            { id: 'l9-s2', en: "We're slightly behind schedule.", zh: '我们稍微落后于计划。', key: 'schedule', ipa: '/ˈʃedjuːl/', focus: ['ʃ', 'stress'], tip: 'schedule 开头是 /ʃ/ 不是 /s/，重音在首音节。' },
            { id: 'l9-s3', en: "I'll send you an update by Friday.", zh: '周五前我发你更新。', key: 'update', ipa: '/ˌʌpˈdeɪt/', focus: ['linking', 'stress'], tip: 'send you an 可以连读，重音落在 update 和 Friday。' }
          ]
        }
      ]
    },
    {
      id: 'u4', index: '04', title: '进阶 · 旅行与观点', en: 'Travel & Opinions',
      desc: '从值机到表达看法，把句子说得像一段自然的话。',
      color: '#E2508A', tint: '#FFEDF4',
      lessons: [
        {
          id: 'l10', title: '机场值机', en: 'At the Airport', xp: 55,
          sentences: [
            { id: 'l10-s1', en: "I'd like to check in for my flight.", zh: '我想办理登机手续。', key: 'check', ipa: '/tʃek/', focus: ['tʃ', 'linking'], tip: 'check in 连读；/tʃ/ 是一个音，别拆成两个。' },
            { id: 'l10-s2', en: 'Just one carry-on bag, please.', zh: '只有一件随身行李。', key: 'carry', ipa: '/ˈkæri/', focus: ['æ', 'r'], tip: 'carry 的 /æ/ 嘴巴张大，/r/ 舌尖上卷不碰上颚。' },
            { id: 'l10-s3', en: 'Is the flight on time?', zh: '航班准点吗？', key: 'flight', ipa: '/flaɪt/', focus: ['l', 'intonation'], tip: 'flight 的 /fl/ 辅音连缀要连起来，句尾上扬。' }
          ]
        },
        {
          id: 'l11', title: '酒店入住', en: 'Checking In', xp: 55,
          sentences: [
            { id: 'l11-s1', en: 'I have a reservation under Zhou.', zh: '我有预订，名字是周。', key: 'reservation', ipa: '/ˌrezəˈveɪʃn/', focus: ['ʃ', 'stress'], tip: 'reservation 重音在 -va- 上，/ʃn/ 收尾别加多余元音。' },
            { id: 'l11-s2', en: 'Could I get a room on a higher floor?', zh: '能给我安排高楼层的房间吗？', key: 'higher', ipa: '/ˈhaɪə/', focus: ['linking', 'intonation'], tip: 'get a / on a 都连读，句尾保持礼貌上扬。' },
            { id: 'l11-s3', en: 'What time is breakfast served?', zh: '早餐几点供应？', key: 'served', ipa: '/sɜːvd/', focus: ['s', 'ə'], tip: 'served 词尾 /d/ 要轻但清楚，别整个吞掉。' }
          ]
        },
        {
          id: 'l12', title: '说出观点', en: 'Expressing Ideas', xp: 60,
          sentences: [
            { id: 'l12-s1', en: "I'd say it depends on the situation.", zh: '我觉得要看情况。', key: 'situation', ipa: '/ˌsɪtʃuˈeɪʃn/', focus: ['tʃ', 'stress'], tip: 'situation 里 -tu- 自然变成 /tʃu/，重音在 -a-。' },
            { id: 'l12-s2', en: 'What matters most is how we use it.', zh: '最要紧的是我们怎么用它。', key: 'matters', ipa: '/ˈmætəz/', focus: ['æ', 's'], tip: 'matters 词尾 /z/ 要振动声带；整句按意群一气读完。' },
            { id: 'l12-s3', en: "That's a really interesting question.", zh: '这是个很有意思的问题。', key: 'really', ipa: '/ˈrɪəli/', focus: ['r', 'l', 'stress'], tip: 'really 里 /r/ 和 /l/ 都在，别把中间的音吞掉。' }
          ]
        }
      ]
    },
    {
      id: 'u5', index: '05', title: '校园 · 课堂与学习', en: 'Campus & Learning',
      desc: '提问、分组讨论、找资料，把课上的英语说顺。',
      color: '#2F7DE1', tint: '#E9F2FF',
      lessons: [
        {
          id: 'l13', title: '课堂提问', en: 'Asking in Class', xp: 60,
          sentences: [
            { id: 'l13-s1', en: 'Could you explain that again?', zh: '能再讲一遍吗？', key: 'explain', ipa: '/ɪkˈspleɪn/', focus: ['ɪ', 'stress'], tip: 'explain 重音在第二音节，首音节弱读成 /ɪk/。' },
            { id: 'l13-s2', en: 'I have a question about the last slide.', zh: '我对最后一页有问题。', key: 'question', ipa: '/ˈkwestʃən/', focus: ['tʃ', 'ə'], tip: 'question 里 -tion 前有 /tʃ/，词尾 -ən 要弱化。' },
            { id: 'l13-s3', en: 'That makes sense now, thanks.', zh: '现在明白了，谢谢。', key: 'sense', ipa: '/sens/', focus: ['s', 'linking'], tip: 'makes sense 两个 /s/ 连在一起别断开，词尾 /s/ 要清楚。' }
          ]
        },
        {
          id: 'l14', title: '小组讨论', en: 'Group Work', xp: 60,
          sentences: [
            { id: 'l14-s1', en: 'Shall we split the work?', zh: '我们分一下工吧？', key: 'split', ipa: '/splɪt/', focus: ['ɪ', 'intonation'], tip: 'split 的 /spl/ 辅音连缀一气带过，句尾上扬更自然。' },
            { id: 'l14-s2', en: "I'll take care of the research part.", zh: '我负责调研部分。', key: 'research', ipa: '/rɪˈsɜːtʃ/', focus: ['r', 'stress'], tip: 'research 重音在第二音节，开头的 r 舌尖上卷不碰上颚。' },
            { id: 'l14-s3', en: "Let's meet after class to compare notes.", zh: '下课后我们对一下笔记。', key: 'compare', ipa: '/kəmˈpeə/', focus: ['ə', 'linking'], tip: 'compare 首音节弱读；meet after、after class 都可以连读。' }
          ]
        },
        {
          id: 'l15', title: '图书馆与考试', en: 'Library & Exams', xp: 65,
          sentences: [
            { id: 'l15-s1', en: 'Where can I find the reference books?', zh: '参考书在哪里？', key: 'reference', ipa: '/ˈrefrəns/', focus: ['r', 'ə'], tip: 'reference 重音在首音节，中间的音节弱读成 /rə/。' },
            { id: 'l15-s2', en: 'The deadline has been moved to Monday.', zh: '截止日期改到周一了。', key: 'deadline', ipa: '/ˈdedlaɪn/', focus: ['stress', 'linking'], tip: 'deadline 重音在首音节，has been 弱读，别逐词顿开。' },
            { id: 'l15-s3', en: 'I need to review before the final exam.', zh: '期末考前我得复习。', key: 'review', ipa: '/rɪˈvjuː/', focus: ['r', 'ɪ'], tip: 'review 重音在第二音节，别把首音节读成长音 /riː/。' }
          ]
        }
      ]
    },
    {
      id: 'u6', index: '06', title: '社交 · 邀请与感受', en: 'Social & Feelings',
      desc: '邀约、道谢、婉拒，把客气话说得不生硬。',
      color: '#8B5CF6', tint: '#F3EDFF',
      lessons: [
        {
          id: 'l16', title: '发出邀请', en: 'Making Plans', xp: 65,
          sentences: [
            { id: 'l16-s1', en: 'Are you free this weekend?', zh: '这周末有空吗？', key: 'this', ipa: '/ðɪs/', focus: ['ð', 'intonation'], tip: 'this 用浊音 /ð/ 开头；一般疑问句句尾上扬。' },
            { id: 'l16-s2', en: "We're having a small get-together on Saturday.", zh: '周六我们有个小聚会。', key: 'together', ipa: '/təˈɡeðə/', focus: ['ð', 'ə'], tip: 'together 中间的 /ð/ 要咬舌，首尾两个音节都弱读。' },
            { id: 'l16-s3', en: 'Feel free to bring a friend.', zh: '带个朋友来也没问题。', key: 'feel', ipa: '/fiːl/', focus: ['iː', 'l'], tip: 'feel 的长音拖足，词尾暗 l 舌尖抵住上齿龈。' }
          ]
        },
        {
          id: 'l17', title: '表达感受', en: 'Showing Appreciation', xp: 70,
          sentences: [
            { id: 'l17-s1', en: "I'm really glad you could make it.", zh: '真高兴你能来。', key: 'glad', ipa: '/ɡlæd/', focus: ['æ', 'linking'], tip: 'glad 的 /æ/ 嘴巴张大；glad you 可以自然连读。' },
            { id: 'l17-s2', en: "That's so thoughtful of you.", zh: '你想得真周到。', key: 'thoughtful', ipa: '/ˈθɔːtfl/', focus: ['θ', 'ə'], tip: 'thoughtful 开头是咬舌音 /θ/，别读成 /s/。' },
            { id: 'l17-s3', en: 'I had a great time tonight.', zh: '今晚玩得很开心。', key: 'great', ipa: '/ɡreɪt/', focus: ['r', 'linking'], tip: 'had a 连读成 /hədə/；great 里 /ɡr/ 连缀要连贯。' }
          ]
        },
        {
          id: 'l18', title: '委婉拒绝', en: 'Polite Declines', xp: 70,
          sentences: [
            { id: 'l18-s1', en: "I'd love to, but I already have plans.", zh: '我很想去，但已经有安排了。', key: 'already', ipa: '/ɔːlˈredi/', focus: ['l', 'stress'], tip: 'already 重音在第二音节，别把 /l/ 吞掉。' },
            { id: 'l18-s2', en: 'Could we take a rain check?', zh: '能改天吗？', key: 'rain', ipa: '/reɪn/', focus: ['r', 'intonation'], tip: 'rain 的 /r/ 起音要卷舌；句尾上扬听起来更委婉。' },
            { id: 'l18-s3', en: 'Maybe next time, though.', zh: '不过下次吧。', key: 'though', ipa: '/ðəʊ/', focus: ['ð', 'intonation'], tip: 'though 开头是 /ð/，句尾轻微下降显得更自然。' }
          ]
        }
      ]
    },
    {
      id: 'u7', index: '07', title: '办事 · 健康与日常', en: 'Health & Errands',
      desc: '看医生、寄快递、报修，遇到事儿也能说清楚。',
      color: '#16A34A', tint: '#E8F7EE',
      lessons: [
        {
          id: 'l19', title: '看医生', en: 'At the Clinic', xp: 70,
          sentences: [
            { id: 'l19-s1', en: "I've had a sore throat since yesterday.", zh: '我昨天开始喉咙痛。', key: 'throat', ipa: '/θrəʊt/', focus: ['θ', 'r'], tip: 'throat 里 /θ/ 后紧接 /r/：先咬舌再卷舌，别读成 /s/。' },
            { id: 'l19-s2', en: 'Does it hurt when you swallow?', zh: '吞咽的时候疼吗？', key: 'swallow', ipa: '/ˈswɒləʊ/', focus: ['w', 'ə'], tip: 'swallow 起音双唇收圆，词尾 -ow 读得轻一点。' },
            { id: 'l19-s3', en: 'Take this medicine twice a day.', zh: '这个药一天吃两次。', key: 'medicine', ipa: '/ˈmedsn/', focus: ['s', 'stress'], tip: 'medicine 中间的元音常弱化，别读成三个完整音节。' }
          ]
        },
        {
          id: 'l20', title: '银行与邮寄', en: 'Bank & Post', xp: 75,
          sentences: [
            { id: 'l20-s1', en: "I'd like to open an account.", zh: '我想开个账户。', key: 'account', ipa: '/əˈkaʊnt/', focus: ['ə', 'stress'], tip: 'account 重音在第二音节，首音节弱读成 /ə/。' },
            { id: 'l20-s2', en: 'How long will the delivery take?', zh: '快递要多久？', key: 'delivery', ipa: '/dɪˈlɪvəri/', focus: ['ɪ', 'l'], tip: 'delivery 重音在 -liv-，注意两个短音 /ɪ/ 和清晰的 /l/。' },
            { id: 'l20-s3', en: 'Could you weigh this package for me?', zh: '能帮我称一下这个包裹吗？', key: 'weigh', ipa: '/weɪ/', focus: ['w', 'intonation'], tip: 'weigh 起音双唇收圆，句尾礼貌上扬。' }
          ]
        },
        {
          id: 'l21', title: '报修与投诉', en: 'Reporting a Problem', xp: 75,
          sentences: [
            { id: 'l21-s1', en: "The air conditioner isn't working.", zh: '空调坏了。', key: 'conditioner', ipa: '/kənˈdɪʃənə/', focus: ['ʃ', 'ə'], tip: 'conditioner 重音在 -di-，/ʃ/ 别读成 /s/。' },
            { id: 'l21-s2', en: 'Someone will come to check it this afternoon.', zh: '今天下午有人来查看。', key: 'check', ipa: '/tʃek/', focus: ['tʃ', 'linking'], tip: 'check it 连读；/tʃ/ 是一个完整的音，别拆开。' },
            { id: 'l21-s3', en: "I'd like to speak to the manager, please.", zh: '麻烦请经理来一下。', key: 'manager', ipa: '/ˈmænɪdʒə/', focus: ['æ', 'ə'], tip: 'manager 的 /æ/ 张大嘴，词尾 -er 弱读。' }
          ]
        }
      ]
    },
    {
      id: 'u8', index: '08', title: '进阶 · 面试与远程协作', en: 'Interview & Remote Work',
      desc: '介绍自己、谈优势、开线上会，说得更稳也更有分寸。',
      color: '#334155', tint: '#EDF1F7',
      lessons: [
        {
          id: 'l22', title: '面试自我介绍', en: 'Introducing Yourself', xp: 80,
          sentences: [
            { id: 'l22-s1', en: 'Tell me a bit about yourself.', zh: '简单介绍一下你自己。', key: 'yourself', ipa: '/jɔːˈself/', focus: ['stress', 'linking'], tip: 'yourself 重音在 -self，tell me a 可以连读。' },
            { id: 'l22-s2', en: "I've worked on several cross-functional projects.", zh: '我参与过多个跨部门项目。', key: 'several', ipa: '/ˈsevrəl/', focus: ['v', 'ə'], tip: 'several 里的 /v/ 要咬下唇，词尾 -ral 弱化。' },
            { id: 'l22-s3', en: "I'm looking for a role with more ownership.", zh: '我在找一个能更多主导的岗位。', key: 'ownership', ipa: '/ˈəʊnəʃɪp/', focus: ['ə', 'ʃ'], tip: 'ownership 重音在首音节，/ʃ/ 别读成 /s/。' }
          ]
        },
        {
          id: 'l23', title: '谈优势与规划', en: 'Strengths & Goals', xp: 80,
          sentences: [
            { id: 'l23-s1', en: 'What would you say is your greatest strength?', zh: '你最大的优势是什么？', key: 'strength', ipa: '/streŋθ/', focus: ['θ', 'ŋ'], tip: 'strength 结尾 /ŋθ/ 是个难点：先后鼻音，再咬舌送气。' },
            { id: 'l23-s2', en: "I'm comfortable with ambiguity and fast changes.", zh: '我能适应不确定和快速变化。', key: 'ambiguity', ipa: '/ˌæmbɪˈɡjuːəti/', focus: ['æ', 'stress'], tip: 'ambiguity 重音在 -gu-，开头的 /æ/ 嘴巴张大。' },
            { id: 'l23-s3', en: 'Where do you see yourself in three years?', zh: '你三年后想做什么？', key: 'three', ipa: '/θriː/', focus: ['θ', 'iː'], tip: 'three 先咬舌 /θ/ 再接 /r/，长音 /iː/ 拖足。' }
          ]
        },
        {
          id: 'l24', title: '远程协作', en: 'Remote Meetings', xp: 85,
          sentences: [
            { id: 'l24-s1', en: 'Can everyone hear me clearly?', zh: '大家能听清我说话吗？', key: 'clearly', ipa: '/ˈklɪəli/', focus: ['ɪ', 'l'], tip: 'clearly 里有两个 /l/，别把中间的音吞掉。' },
            { id: 'l24-s2', en: "I'll share the link in the chat.", zh: '我把链接发到聊天里。', key: 'share', ipa: '/ʃeə/', focus: ['ʃ', 'linking'], tip: 'share 开头是 /ʃ/，share the 之间别硬停顿。' },
            { id: 'l24-s3', en: "Let's circle back after the stand-up.", zh: '站会后我们再回来聊这个。', key: 'circle', ipa: '/ˈsɜːkl/', focus: ['s', 'l'], tip: 'circle 词尾 /kl/ 要收干净，别在后面加多余的元音。' }
          ]
        }
      ]
    }
  ];

  var lessons = [];
  units.forEach(function (unit) {
    unit.lessons.forEach(function (lesson) {
      lesson.unitId = unit.id;
      lesson.unit = unit;
      lesson.index = lessons.length + 1;
      lessons.push(lesson);
    });
  });

  var totalSentences = 0;
  lessons.forEach(function (l) { totalSentences += l.sentences.length; });

  SB.data = {
    units: units,
    lessons: lessons,
    totalSentences: totalSentences,
    phonemes: phonemes,
    dailyGoal: { sentences: 9, minutes: 5 },
    getLesson: function (id) {
      for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) return lessons[i];
      return null;
    },
    nextLesson: function (id) {
      for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) return lessons[i + 1] || null;
      return null;
    },
    achievements: [
      { id: 'first', title: '开口第一步', desc: '完成第一次跟读', icon: 'bolt' },
      { id: 'streak3', title: '坚持三天', desc: '连续打卡 3 天', icon: 'flame' },
      { id: 'star90', title: '发音高手', desc: '单句得分达到 90', icon: 'star' },
      { id: 'unit1', title: '破冰完成', desc: '完成第一单元全部关卡', icon: 'trophy' },
      { id: 'words50', title: '词汇积累', desc: '累计练习 50 个句子', icon: 'book' },
      { id: 'allUnits', title: '全程通关', desc: '完成全部单元的每一关', icon: 'sparkle' }
    ]
  };
})(window);
