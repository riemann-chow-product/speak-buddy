/* SpeakBuddy - 真实情景对话：剧本数据 + 沟通达成度评测
 *
 * 跟读练「把音发准」，对话练「把话说出去」。这里不要求逐字复现：
 * 每轮给出若干种可接受的说法，按「意图关键词组 + 表达相似度」判定是否达成沟通目标，
 * 再叠加发音/流利度，得到综合得分。全部离线运行，不依赖后端或大模型。
 */
(function (global) {
  'use strict';
  var SB = (global.SB = global.SB || {});

  /* keys 是「同义词组」：每组命中任意一个词即算达成；不同组代表这一步必须包含的语义。 */
  var SCENARIOS = [
    {
      id: 'airport', title: '机场问询', en: 'At the Check-in Desk', icon: 'globe', color: '#0EA5A4', tint: '#E3F7F4',
      topics: ['travel', 'daily'], level: 1,
      place: '登机口附近的问询柜台，离起飞还有 40 分钟', you: '乘客', partner: '地勤 Alex',
      goal: '问清航班是否准点、登机口有没有变，并办完行李',
      turns: [
        {
          partner: { en: "Good morning! How can I help you today?", zh: '早上好，有什么可以帮您？' },
          goal: '问一下你的航班准不准点',
          hint: '用 "Is the flight on time?" 或 "Could you tell me if ...?" 开头。',
          answers: [
            { en: "Is the flight on time?", zh: '航班准点吗？', keys: [['flight', 'plane'], ['time', 'schedule', 'delay', 'delayed'], ['is', 'could', 'tell', 'do']] },
            { en: "Could you tell me if Flight CA183 is delayed?", zh: '能告诉我 CA183 航班延误了吗？', keys: [['flight', 'ca183'], ['delay', 'delayed', 'time'], ['could', 'tell', 'check', 'is']] }
          ],
          coach: '问航班状态最自然的两句：Is the flight on time? / Has the flight been delayed? 句尾记得上扬。'
        },
        {
          partner: { en: "It's running about twenty minutes late. Anything else I can do for you?", zh: '大约晚点 20 分钟，还有其他需要吗？' },
          goal: '确认登机口有没有变化',
          hint: '登机口是 gate，不是 door。试试 "Which gate...?" 或 "Has the gate changed?"',
          answers: [
            { en: "Which gate should I go to?", zh: '我应该去哪个登机口？', keys: [['gate'], ['which', 'where', 'what'], ['go', 'board', 'should']] },
            { en: "Has the gate changed?", zh: '登机口改了吗？', keys: [['gate'], ['change', 'changed', 'still', 'same'], ['has', 'is', 'do']] }
          ],
          coach: 'Has the gate changed? 用现在完成时，问的是「到现在为止有没有变」，比 Did the gate change 更贴合现场。'
        },
        {
          partner: { en: "Still Gate 12. Do you have any bags to check in?", zh: '还是 12 号登机口，有行李要托运吗？' },
          goal: '说明自己只有随身行李',
          hint: '只带随身行李可以说 "I only have a carry-on."',
          answers: [
            { en: "No, just this carry-on, thanks.", zh: '没有，只有这个随身包，谢谢。', keys: [['no', 'dont', 'nothing'], ['carry', 'hand', 'only', 'just'], ['thank', 'thanks']] },
            { en: "Yes, one suitcase, please.", zh: '有的，托运一个箱子。', keys: [['yes', 'one'], ['suitcase', 'bag', 'check', 'luggage'], ['please', 'thank']] }
          ],
          coach: '把 No / Yes 说清楚再补一句细节，对方就不用追问第二次了。'
        },
        {
          partner: { en: "All set. Here's your boarding pass. Have a nice flight!", zh: '都办好了，这是您的登机牌，旅途愉快！' },
          goal: '表示感谢，并确认什么时候开始登机',
          hint: '"Thank you. What time does boarding start?" 或 "Thanks, I will head to the gate now."',
          answers: [
            { en: "Thank you. What time does boarding start?", zh: '谢谢，什么时候开始登机？', keys: [['thank', 'thanks'], ['time', 'when'], ['boarding', 'board']] },
            { en: "Thanks a lot. I'll head to the gate now.", zh: '非常感谢，我现在去登机口。', keys: [['thank', 'thanks'], ['gate'], ['now', 'head', 'go', 'will']] }
          ],
          coach: '收尾别只回一个 OK。一句感谢 + 一个后续动作，听起来才像真的把对话接住了。'
        }
      ]
    },
    {
      id: 'cafe', title: '咖啡店点单', en: 'At the Coffee Shop', icon: 'coffee', color: '#B45309', tint: '#FFF3E3',
      topics: ['food', 'daily', 'travel'], level: 1,
      place: '街角咖啡店，早上 8:40，你赶着去上班', you: '顾客', partner: '店员 Maya',
      goal: '点到一杯合适的咖啡，问清价格并完成付款',
      turns: [
        {
          partner: { en: "Hi there! What can I get for you today?", zh: '你好！今天想喝点什么？' },
          goal: '点一杯饮料，说清杯型或冷热',
          hint: '"Could I have a medium latte, please?" / "I would like an iced Americano."',
          answers: [
            { en: "Could I have a medium latte, please?", zh: '请给我一杯中杯拿铁。', keys: [['could', 'would', 'like', 'have', 'get'], ['latte', 'coffee', 'americano'], ['medium', 'large', 'iced', 'hot'], ['please']] },
            { en: "I'd like an iced Americano, please.", zh: '我要一杯冰美式。', keys: [['would', 'like', 'have', 'could'], ['americano', 'coffee', 'latte'], ['iced', 'cold', 'hot', 'large'], ['please']] }
          ],
          coach: 'Could I have... / I would like... 比 I want... 柔和得多，是点单的默认句式。'
        },
        {
          partner: { en: "Sure. Would you like it hot or iced?", zh: '好的，您要热的还是冰的？' },
          goal: '明确回答冷热，顺便加一个小要求',
          hint: '直接回答 "Iced, please." 再加一句 "Not too much ice."',
          answers: [
            { en: "Iced, please. Not too much ice.", zh: '冰的，请少放点冰。', keys: [['iced', 'cold', 'hot', 'warm'], ['please', 'thank'], ['ice', 'sugar', 'milk', 'too']] },
            { en: "Hot, please. Could you make it oat milk?", zh: '热的，可以换成燕麦奶吗？', keys: [['hot', 'iced', 'cold'], ['please', 'thank'], ['milk', 'oat', 'make']] }
          ],
          coach: '选择疑问句不用重复整句，一个词 + please 就能接住，再补一个具体要求更自然。'
        },
        {
          partner: { en: "No problem. That's four fifty. Anything else?", zh: '没问题，一共 4.5 元，还需要别的吗？' },
          goal: '确认价格并说不用了',
          hint: '"That\'s all, thank you." / "Nothing else, thanks. Can I pay by card?"',
          answers: [
            { en: "That's all, thank you. Can I pay by card?", zh: '就这些，谢谢，可以刷卡吗？', keys: [['all', 'nothing', 'else', 'no'], ['thank', 'thanks'], ['pay', 'card', 'cash']] },
            { en: "Nothing else, thanks. Here's my card.", zh: '不用了谢谢，这是我的卡。', keys: [['nothing', 'all', 'no'], ['thank', 'thanks'], ['card', 'pay', 'cash', 'here']] }
          ],
          coach: '付款方式用 pay by card / pay in cash，不要说 pay with card by machine。'
        },
        {
          partner: { en: "All done. Your drink will be ready in a minute.", zh: '好了，饮料一分钟就好。' },
          goal: '道谢并说明自己在哪儿等',
          hint: '"Thanks, I will wait over there."',
          answers: [
            { en: "Thanks, I'll wait over there.", zh: '谢谢，我在那边等。', keys: [['thank', 'thanks'], ['wait'], ['there', 'here', 'over']] },
            { en: "Perfect, thank you. Take your time.", zh: '好的谢谢，不着急。', keys: [['thank', 'thanks'], ['perfect', 'great', 'ok'], ['time', 'wait', 'rush']] }
          ],
          coach: 'Take your time 是很地道的一句「不着急」，比 No hurry 更常见于服务场景。'
        }
      ]
    },
    {
      id: 'smalltalk', title: '初次见面', en: 'Breaking the Ice', icon: 'chat', color: '#8B5CF6', tint: '#F3EDFF',
      topics: ['social', 'daily', 'campus'], level: 1,
      place: '朋友组织的聚会，你第一次见到对方的同事', you: '你自己', partner: '新认识的 Jamie',
      goal: '完成自我介绍，把闲聊接下去而不是冷场',
      turns: [
        {
          partner: { en: "Hi, I don't think we've met. I'm Jamie.", zh: '嗨，我们好像还没见过，我是 Jamie。' },
          goal: '打招呼并介绍自己的名字',
          hint: '"Nice to meet you, Jamie. I\'m ..."',
          answers: [
            { en: "Nice to meet you, Jamie. I'm Alex.", zh: '很高兴认识你 Jamie，我是 Alex。', keys: [['nice', 'great', 'pleasure', 'hi'], ['meet', 'meeting'], ['i', 'my', 'name', 'am']] },
            { en: "Hi Jamie! My name is Alex, nice to meet you.", zh: '嗨 Jamie！我叫 Alex，很高兴认识你。', keys: [['hi', 'hello', 'hey'], ['name', 'i', 'am', 'my'], ['nice', 'meet', 'pleasure']] }
          ],
          coach: 'Nice to meet you 用于第一次见面；之后再见要说 Nice to see you again。'
        },
        {
          partner: { en: "Nice to meet you too! Where are you from?", zh: '我也很高兴认识你！你从哪里来？' },
          goal: '回答自己来自哪里，再补一句',
          hint: '"I\'m from Shanghai, China. I\'ve been here for two years."',
          answers: [
            { en: "I'm from Shanghai, China.", zh: '我来自中国上海。', keys: [['i', 'my', 'am', 'from'], ['shanghai', 'china', 'beijing', 'here'], ['from', 'in']] },
            { en: "I grew up in Chengdu, but I live here now.", zh: '我在成都长大，不过现在住这儿。', keys: [['i', 'my'], ['chengdu', 'china', 'grew', 'growing'], ['live', 'now', 'here']] }
          ],
          coach: 'I am from... 回答籍贯，I live in... 回答现居地，两个别混。'
        },
        {
          partner: { en: "Oh nice! What do you do for a living?", zh: '真不错！你是做什么工作的？' },
          goal: '说清自己的职业或身份',
          hint: '"I work in product design." / "I\'m a student majoring in ..."',
          answers: [
            { en: "I work in product design.", zh: '我做产品设计。', keys: [['i', 'my', 'am'], ['work', 'design', 'engineer', 'teacher'], ['product', 'design', 'company']] },
            { en: "I'm a graduate student studying computer science.", zh: '我是计算机方向的研究生。', keys: [['i', 'my', 'am'], ['student', 'study', 'studying', 'major'], ['computer', 'science', 'graduate']] }
          ],
          coach: 'What do you do 问的是职业，不是「你现在在干嘛」，别答成 I am reading。'
        },
        {
          partner: { en: "That sounds interesting! How do you know the host?", zh: '听起来很有意思！你怎么认识主人的？' },
          goal: '说明关系并把话题抛回去',
          hint: '"We used to work together. How about you?"',
          answers: [
            { en: "We used to work together. How about you?", zh: '我们以前是同事，你呢？', keys: [['we', 'used', 'worked', 'work'], ['work', 'colleague', 'school', 'together'], ['how', 'about', 'you', 'and']] },
            { en: "We were classmates at university. And you?", zh: '我们是大学同学，你呢？', keys: [['we', 'were', 'classmates'], ['classmate', 'university', 'school', 'college'], ['and', 'you', 'how', 'about']] }
          ],
          coach: '闲聊的秘诀是「回答 + 反问」。只答不问，对话三句就断了。'
        }
      ]
    },
    {
      id: 'directions', title: '街头问路', en: 'Asking for Directions', icon: 'globe', color: '#2F7DE1', tint: '#E9F2FF',
      topics: ['travel', 'daily'], level: 1,
      place: '第一次到这座城市，手机没电，你要去最近的地铁站', you: '路人', partner: '本地人 Sam',
      goal: '问到地铁站、听懂指路并确认步行时间',
      turns: [
        {
          partner: { en: "You look a bit lost. Need any help?", zh: '你看起来有点迷路，需要帮忙吗？' },
          goal: '礼貌地说明你要找地铁站',
          hint: '"Excuse me, where is the nearest station?"',
          answers: [
            { en: "Excuse me, where is the nearest station?", zh: '打扰一下，最近的车站在哪？', keys: [['excuse', 'sorry', 'hi'], ['where', 'how', 'which'], ['station', 'subway', 'metro', 'nearest']] },
            { en: "Yes, please. Could you point me to the subway?", zh: '是的，能指一下地铁怎么走吗？', keys: [['yes', 'please', 'could'], ['point', 'tell', 'show', 'find'], ['subway', 'metro', 'station']] }
          ],
          coach: '开口先说 Excuse me，比直接抛问题更礼貌；nearest 比 closest 更常用于问地点。'
        },
        {
          partner: { en: "Go straight for two blocks, then turn left at the corner.", zh: '直走两个街区，在路口左转。' },
          goal: '复述关键方向，确认自己没听错',
          hint: '"So, straight and then left at the corner, right?"',
          answers: [
            { en: "So, straight and then left at the corner, right?", zh: '所以是直走，然后在路口左转，对吗？', keys: [['straight', 'go', 'ahead'], ['left', 'right', 'turn'], ['corner', 'right', 'correct']] },
            { en: "Let me check: two blocks, then turn left?", zh: '我确认一下：两个街区然后左转？', keys: [['check', 'let', 'so', 'confirm'], ['two', 'blocks', 'straight'], ['left', 'turn']] }
          ],
          coach: '听不懂指路不丢人，用自己的话复述一遍 + right? 是母语者最常用的确认方式。'
        },
        {
          partner: { en: "Exactly. It's about a five-minute walk.", zh: '没错，大概走五分钟。' },
          goal: '确认距离并道谢',
          hint: '"That\'s close, thanks a lot!"',
          answers: [
            { en: "Great, that's not far. Thanks a lot!", zh: '太好了，不远，非常感谢！', keys: [['great', 'good', 'perfect', 'ok'], ['far', 'close', 'minute', 'walk'], ['thank', 'thanks']] },
            { en: "Only five minutes? Thank you so much.", zh: '只要五分钟吗？太谢谢了。', keys: [['five', 'minute', 'minutes'], ['thank', 'thanks'], ['much', 'so', 'lot']] }
          ],
          coach: 'five-minute walk 里 minute 不加 s，因为它是复合形容词。'
        },
        {
          partner: { en: "No problem. Enjoy your day!", zh: '不客气，祝你玩得开心！' },
          goal: '回应祝福，结束对话',
          hint: '"You too! Have a good one."',
          answers: [
            { en: "Thanks, you too!", zh: '谢谢，你也是！', keys: [['thank', 'thanks'], ['you', 'too'], ['good', 'nice', 'great']] },
            { en: "You too, have a great day!", zh: '你也是，祝你今天愉快！', keys: [['you', 'too'], ['have', 'great', 'good'], ['day', 'one']] }
          ],
          coach: '别人说 Enjoy your day，最自然的回法是 You too，不用再重复一遍长句。'
        }
      ]
    },
    {
      id: 'shopping', title: '退换商品', en: 'Returning an Item', icon: 'home', color: '#635BFF', tint: '#F0EEFF',
      topics: ['daily', 'opinion'], level: 2,
      place: '买回来的外套尺码不对，你带着小票回到店里', you: '顾客', partner: '客服 Nina',
      goal: '说明问题、提出换货并确认能否退款',
      turns: [
        {
          partner: { en: "Hello! How can I help you today?", zh: '您好，有什么可以帮您？' },
          goal: '说明来意：这件衣服尺码不合适',
          hint: '"I\'d like to return this jacket. It doesn\'t fit."',
          answers: [
            { en: "I'd like to return this jacket. It doesn't fit.", zh: '我想退这件外套，尺码不合适。', keys: [['would', 'like', 'want', 'need'], ['return', 'exchange', 'change'], ['fit', 'size', 'small', 'big', 'large']] },
            { en: "I bought this yesterday, but the size is wrong.", zh: '我昨天买的，但尺码不对。', keys: [['bought', 'buy', 'purchased', 'got'], ['size', 'fit'], ['wrong', 'small', 'large', 'big']] }
          ],
          coach: 'return 是退货，exchange 是换货。想换一件同款不同码，说 exchange 更准确。'
        },
        {
          partner: { en: "I see. Do you have the receipt with you?", zh: '明白了，您带小票了吗？' },
          goal: '确认有凭证，并提出想换大一号的',
          hint: '"Yes, here it is. Could I exchange it for a larger size?"',
          answers: [
            { en: "Yes, here it is. Could I exchange it for a larger size?", zh: '带了，给您。能换大一号的吗？', keys: [['yes', 'here', 'sure'], ['receipt', 'here', 'it'], ['exchange', 'change', 'swap', 'larger', 'size']] },
            { en: "Here's the receipt. I'd prefer a refund, please.", zh: '这是小票，我更想退款。', keys: [['here', 'receipt', 'yes'], ['refund', 'money', 'back', 'prefer'], ['please', 'thank']] }
          ],
          coach: 'larger size 比 bigger size 正式；想直接退钱用 refund，别说 return the money。'
        },
        {
          partner: { en: "Sure, we have a large in stock. Would that work?", zh: '有的，大号还有库存，这样可以吗？' },
          goal: '确认可以，顺便问要不要补差价',
          hint: '"That works. Do I need to pay any difference?"',
          answers: [
            { en: "That works perfectly. Do I need to pay the difference?", zh: '这样可以，需要补差价吗？', keys: [['works', 'great', 'perfect', 'yes', 'good'], ['pay', 'difference', 'extra', 'price'], ['need', 'do', 'have']] },
            { en: "Yes, please. Is there any extra charge?", zh: '好的，有额外费用吗？', keys: [['yes', 'please', 'sure'], ['extra', 'charge', 'pay', 'difference'], ['there', 'is', 'any']] }
          ],
          coach: 'Would that work? 是在问方案能不能接受，回一句 That works 就很干脆。'
        },
        {
          partner: { en: "No extra charge. It'll just take a minute.", zh: '不用额外付费，一会儿就好。' },
          goal: '感谢并确认取件方式',
          hint: '"Thank you. Should I wait here or come back later?"',
          answers: [
            { en: "Thank you. Should I wait here or come back later?", zh: '谢谢，我在这儿等还是稍后再来？', keys: [['thank', 'thanks'], ['wait', 'come', 'pick', 'here'], ['should', 'or', 'later']] },
            { en: "Thanks a lot, I'll wait right here.", zh: '多谢，我就在这儿等。', keys: [['thank', 'thanks'], ['wait', 'here'], ['will', 'right', 'stay']] }
          ],
          coach: '把「接下来我该做什么」问清楚，是服务场景里最省时间的一句话。'
        }
      ]
    },
    {
      id: 'clinic', title: '看诊描述症状', en: 'At the Clinic', icon: 'heart', color: '#16A34A', tint: '#E8F7EE',
      topics: ['health', 'daily'], level: 2,
      place: '社区诊所，你从昨天开始喉咙痛、有点发烧', you: '患者', partner: '医生 Lee',
      goal: '说清症状和持续时间，问清用药与注意事项',
      turns: [
        {
          partner: { en: "Good morning. What seems to be the problem?", zh: '早上好，哪里不舒服？' },
          goal: '说清主要症状和开始时间',
          hint: '"I\'ve had a sore throat since yesterday, and a slight fever."',
          answers: [
            { en: "I've had a sore throat since yesterday.", zh: '我从昨天开始喉咙痛。', keys: [['have', 'had', 'i', 'been'], ['sore', 'throat', 'hurt', 'pain'], ['yesterday', 'since', 'days', 'ago']] },
            { en: "I have a headache and a bit of a fever.", zh: '我头疼，还有点发烧。', keys: [['have', 'i', 'got'], ['headache', 'fever', 'head', 'temperature'], ['bit', 'slight', 'little']] }
          ],
          coach: '症状持续到现在用 I have had ... since/for ...，比 I am having 更符合看诊表达。'
        },
        {
          partner: { en: "I see. How high is the fever? Any other symptoms?", zh: '了解了，烧到多少度？还有其他症状吗？' },
          goal: '补充体温和另一个症状',
          hint: '"Around thirty-eight degrees, and I feel tired all the time."',
          answers: [
            { en: "Around thirty-eight degrees, and I feel tired all the time.", zh: '大概 38 度，而且一直觉得累。', keys: [['thirty', 'degrees', 'thirtyeight', '38'], ['feel', 'tired', 'weak', 'cough'], ['and', 'also', 'time']] },
            { en: "About thirty-eight. I also have a dry cough.", zh: '大约 38 度，还有干咳。', keys: [['thirty', 'degrees', 'about', '38'], ['cough', 'dry', 'also'], ['also', 'and', 'have']] }
          ],
          coach: '描述体温用 degrees；补充症状用 I also have... / on top of that...'
        },
        {
          partner: { en: "Okay. Are you allergic to any medication?", zh: '好的，你对什么药物过敏吗？' },
          goal: '回答过敏史',
          hint: '"Not that I know of." / "Yes, I\'m allergic to penicillin."',
          answers: [
            { en: "Not that I know of, no.", zh: '据我所知没有。', keys: [['not', 'no', 'none'], ['know', 'aware', 'think'], ['allergic', 'allergy']] },
            { en: "Yes, I'm allergic to penicillin.", zh: '有，我对青霉素过敏。', keys: [['yes', 'i', 'am'], ['allergic', 'allergy'], ['penicillin', 'medicine', 'drug']] }
          ],
          coach: 'Not that I know of 是「据我所知没有」的地道说法，比只回一句「不知道」更清楚。'
        },
        {
          partner: { en: "Alright. I'll prescribe something. Take it twice a day after meals.", zh: '好，我开点药，每天两次，饭后服用。' },
          goal: '确认用法并问能不能正常上班',
          hint: '"Twice a day after meals, got it. Can I still go to work?"',
          answers: [
            { en: "Twice a day after meals, got it. Can I still go to work?", zh: '每天两次饭后服用，记住了。还能去上班吗？', keys: [['twice', 'two', 'day'], ['meals', 'food', 'after'], ['work', 'go', 'can', 'still']] },
            { en: "Okay, thank you. Should I avoid anything?", zh: '好的谢谢，有什么需要忌口的吗？', keys: [['thank', 'thanks', 'okay', 'got'], ['avoid', 'should', 'anything', 'eat'], ['should', 'can', 'need']] }
          ],
          coach: '把医嘱复述一遍再提问，既确认信息，也显得你在认真听。'
        }
      ]
    },
    {
      id: 'standup', title: '团队站会', en: 'Daily Stand-up', icon: 'briefcase', color: '#F0842C', tint: '#FFF1E4',
      topics: ['work', 'tech'], level: 2,
      place: '周一早上的 10 分钟站会，轮到你同步进度', you: '项目成员', partner: '组长 Priya',
      goal: '说清已完成、进行中和遇到的阻碍',
      turns: [
        {
          partner: { en: "Morning! What did you get done last week?", zh: '早上好！上周完成了什么？' },
          goal: '汇报一件已完成的事',
          hint: '"I finished the onboarding flow and shipped it on Friday."',
          answers: [
            { en: "I finished the onboarding flow and shipped it on Friday.", zh: '我完成了新用户引导流程，周五上线了。', keys: [['i', 'we', 'finished', 'completed'], ['onboarding', 'flow', 'feature', 'task'], ['shipped', 'finished', 'released', 'done']] },
            { en: "I wrapped up the API changes and merged the PR.", zh: '我做完了接口改动并合并了 PR。', keys: [['i', 'we', 'wrapped', 'finished'], ['api', 'pr', 'changes', 'code'], ['merged', 'done', 'finished']] }
          ],
          coach: '站会讲结果，不讲过程：finished / shipped / merged 这类动词最有信息量。'
        },
        {
          partner: { en: "Nice. What are you working on today?", zh: '很好，今天在做什么？' },
          goal: '说明今天的重点',
          hint: '"Today I\'m focusing on the payment edge cases."',
          answers: [
            { en: "Today I'm focusing on the payment edge cases.", zh: '今天我主要处理支付的边界情况。', keys: [['today', 'now', 'i'], ['focusing', 'working', 'handling', 'looking'], ['payment', 'edge', 'cases', 'bug', 'test']] },
            { en: "I'll be reviewing the design specs and writing tests.", zh: '我会评审设计文档并补测试。', keys: [['i', 'will', 'be'], ['reviewing', 'writing', 'reading', 'specs'], ['design', 'tests', 'specs']] }
          ],
          coach: 'I am focusing on... / I will be working on... 比 I do... 更能表达「今天这一段」。'
        },
        {
          partner: { en: "Is anything blocking you at the moment?", zh: '现在有什么卡住你的吗？' },
          goal: '提出一个具体阻碍，别只说没有',
          hint: '"Yes, I\'m still waiting on the final copy from the content team."',
          answers: [
            { en: "Yes, I'm still waiting on the final copy from the content team.", zh: '有，我还在等内容团队的最终文案。', keys: [['yes', 'actually', 'still'], ['waiting', 'blocked', 'need', 'stuck'], ['copy', 'content', 'team', 'design', 'api']] },
            { en: "I'm blocked by the staging environment being down.", zh: '预发布环境挂了，我被卡住了。', keys: [['blocked', 'waiting', 'stuck'], ['staging', 'environment', 'server'], ['down', 'broken', 'issue']] }
          ],
          coach: '说 blocker 要具体到「等谁 / 等什么」，否则别人也没法帮你。'
        },
        {
          partner: { en: "Got it. I'll chase that up after the meeting.", zh: '明白，会后我去催一下。' },
          goal: '感谢并给出下一步',
          hint: '"Thanks. I\'ll ping you if it\'s still not here by noon."',
          answers: [
            { en: "Thanks. I'll ping you if it's still not here by noon.", zh: '谢谢，中午前还没到我再找你。', keys: [['thank', 'thanks'], ['ping', 'message', 'let', 'tell', 'update'], ['noon', 'still', 'if', 'by']] },
            { en: "Appreciate it. I'll keep moving on the tests in the meantime.", zh: '多谢，这期间我继续推进测试。', keys: [['appreciate', 'thank', 'thanks'], ['keep', 'continue', 'moving', 'tests'], ['meantime', 'while', 'meanwhile']] }
          ],
          coach: '别人答应帮忙后补一句「我这边会怎么配合」，站会才算真正收口。'
        }
      ]
    },
    {
      id: 'groupwork', title: '小组作业讨论', en: 'Group Project Talk', icon: 'book', color: '#2F7DE1', tint: '#E9F2FF',
      topics: ['campus', 'work'], level: 2,
      place: '图书馆小组讨论，你们的展示下周就要交', you: '组员', partner: '组员 Emma',
      goal: '分工、表达不同意见、敲定时间',
      turns: [
        {
          partner: { en: "So, how should we split the work?", zh: '那我们怎么分工？' },
          goal: '主动认领一部分任务',
          hint: '"I can take the research and put together the slides."',
          answers: [
            { en: "I can take the research and put together the slides.", zh: '我可以负责调研和做幻灯片。', keys: [['i', 'can', 'will', 'could'], ['take', 'handle', 'do', 'research'], ['slides', 'research', 'presentation']] },
            { en: "How about I handle the data part?", zh: '要不我负责数据部分？', keys: [['i', 'how', 'about', 'let'], ['handle', 'take', 'do'], ['data', 'part', 'analysis']] }
          ],
          coach: 'How about I...? 是提分工时很自然的建议句，比 I think I should 轻快。'
        },
        {
          partner: { en: "Sounds good. I was thinking we should focus mostly on theory.", zh: '可以。我本来想以理论为主。' },
          goal: '委婉地提出不同看法',
          hint: '"I see your point, but maybe we need more real examples."',
          answers: [
            { en: "I see your point, but maybe we need more real examples.", zh: '我明白你的意思，不过也许需要更多真实例子。', keys: [['see', 'understand', 'agree', 'point'], ['but', 'maybe', 'however', 'though'], ['examples', 'cases', 'data', 'practice']] },
            { en: "That's fair. Could we balance it with a short case study?", zh: '有道理，能不能加个简短案例平衡一下？', keys: [['fair', 'true', 'agree', 'right'], ['could', 'we', 'can', 'balance'], ['case', 'study', 'example', 'short']] }
          ],
          coach: '先接住对方（I see your point / That is fair），再转折，反对就不像否定人。'
        },
        {
          partner: { en: "True. Let's do both. When can you finish your part?", zh: '有道理，两个都做。你什么时候能完成？' },
          goal: '给出一个明确时间并说明前提',
          hint: '"I\'ll have it ready by Thursday evening, if the data comes in on time."',
          answers: [
            { en: "I'll have it ready by Thursday evening.", zh: '我周四晚上之前能做好。', keys: [['i', 'will', 'have', 'finish'], ['ready', 'done', 'finish', 'send'], ['thursday', 'evening', 'by', 'tomorrow']] },
            { en: "By Friday at the latest, as long as I get the dataset today.", zh: '最晚周五，前提是今天能拿到数据。', keys: [['friday', 'by', 'latest', 'before'], ['dataset', 'data', 'get', 'receive'], ['as', 'long', 'if', 'today']] }
          ],
          coach: '承诺时间时带上 by / at the latest，比模糊的 soon 更让人放心。'
        },
        {
          partner: { en: "Perfect. I'll add your slides to the deck tonight.", zh: '好，我今晚把你的幻灯片并进去。' },
          goal: '确认并主动补一句协作细节',
          hint: '"Great. I\'ll send you the editable file, not a PDF."',
          answers: [
            { en: "Great. I'll send you the editable file, not a PDF.", zh: '好，我发你可编辑的文件，不发 PDF。', keys: [['great', 'perfect', 'ok'], ['send', 'share', 'file', 'will'], ['editable', 'pdf', 'file', 'source']] },
            { en: "Thanks. Let me know if anything needs changing.", zh: '谢谢，有需要改的地方告诉我。', keys: [['thank', 'thanks'], ['let', 'know', 'tell', 'if'], ['changing', 'change', 'needs', 'edit']] }
          ],
          coach: '交付时顺手说清格式/后续配合，是团队合作里最容易被记住的细节。'
        }
      ]
    },
    {
      id: 'interview', title: '面试自我介绍', en: 'Job Interview', icon: 'trophy', color: '#E2508A', tint: '#FFEDF4',
      topics: ['career', 'work', 'opinion'], level: 3,
      place: '线上面试，应聘产品岗，面试官刚打开摄像头', you: '候选人', partner: '面试官 Mr. Chen',
      goal: '讲清经历与优势，并回应一个追问',
      turns: [
        {
          partner: { en: "Thanks for joining us. Could you tell me a bit about yourself?", zh: '感谢参加面试，能简单介绍一下自己吗？' },
          goal: '用两三句讲清背景和当前角色',
          hint: '背景 + 现在做什么 + 一句和岗位相关的成果。',
          answers: [
            { en: "Sure. I've spent the last four years in product design, mostly on B2B tools.", zh: '好的，过去四年我做产品设计，主要是 B2B 工具。', keys: [['sure', 'yes', 'i', 'my'], ['years', 'spent', 'worked', 'background'], ['product', 'design', 'b2b', 'tools']] },
            { en: "I'm a product designer with three years of experience in fintech.", zh: '我是产品设计师，有三年金融科技经验。', keys: [['i', 'am', 'my'], ['product', 'designer', 'design'], ['years', 'experience', 'fintech']] }
          ],
          coach: '自我介绍别背简历，用「年限 + 领域 + 一句成果」三段式，控制在 30 秒。'
        },
        {
          partner: { en: "Interesting. What would you say is your biggest strength?", zh: '有意思，你认为自己最大的优势是什么？' },
          goal: '说一个优势，并给出证据',
          hint: '优势 + 一个具体例子或结果，别只说形容词。',
          answers: [
            { en: "I'd say turning messy feedback into clear priorities. On my last project, we cut the backlog by half.", zh: '我擅长把零散反馈理成清晰优先级，上个项目把待办砍掉一半。', keys: [['say', 'strength', 'good', 'best'], ['feedback', 'priorities', 'communication', 'turning'], ['project', 'backlog', 'cut', 'half', 'result']] },
            { en: "My strength is stakeholder communication. I helped align three teams on one roadmap.", zh: '我的优势是跨方沟通，曾推动三个团队对齐同一路线图。', keys: [['strength', 'good', 'best', 'my'], ['communication', 'stakeholder', 'align', 'teams'], ['roadmap', 'teams', 'helped', 'project']] }
          ],
          coach: '面试官要的是证据。一个数字或一个项目名，比三个形容词管用。'
        },
        {
          partner: { en: "Why are you interested in this role specifically?", zh: '为什么偏偏对这个岗位感兴趣？' },
          goal: '把动机和这家公司/岗位连起来',
          hint: '别只说「想学习」，说清岗位哪里和你的经验接得上。',
          answers: [
            { en: "Because it combines design and data, which is exactly where I want to go deeper.", zh: '因为它把设计和数据结合起来，正是我想深入的方向。', keys: [['because', 'since', 'reason', 'role'], ['design', 'data', 'combines', 'product'], ['deeper', 'want', 'grow', 'interested']] },
            { en: "Your team works on tools I've actually used, and I'd love to improve them.", zh: '你们做的工具我用过，我很想参与改进。', keys: [['team', 'company', 'product', 'tools'], ['used', 'actually', 'familiar', 'love'], ['improve', 'love', 'would', 'want']] }
          ],
          coach: '把「我想来」换成「我的经验能接上你们的哪一块」，动机立刻变可信。'
        },
        {
          partner: { en: "Good. Do you have any questions for us?", zh: '好的，你有什么想问我们的吗？' },
          goal: '问一个关于团队或岗位的高质量问题',
          hint: '问协作方式、成功标准或接下来半年的重点。',
          answers: [
            { en: "Yes. How does the team decide what to build next?", zh: '有，团队怎么决定下一步做什么？', keys: [['yes', 'sure', 'one', 'question'], ['team', 'decide', 'prioritize', 'how'], ['build', 'next', 'roadmap', 'what']] },
            { en: "I'd love to know what success looks like in the first six months.", zh: '我想知道前六个月怎样算做得好。', keys: [['love', 'know', 'would', 'question'], ['success', 'looks', 'measure', 'expect'], ['months', 'first', 'six', 'role']] }
          ],
          coach: '别问薪资福利或「公司几点下班」。问决策方式和成功标准，显得你已经在想怎么干活。'
        }
      ]
    },
    {
      id: 'disagree', title: '委婉表达异议', en: 'Disagreeing Politely', icon: 'sparkle', color: '#DB2777', tint: '#FFEAF3',
      topics: ['opinion', 'work', 'social'], level: 3,
      place: '方案评审会，同事提出一个你觉得风险不小的排期', you: '项目成员', partner: '同事 Daniel',
      goal: '表达不同意见但不伤人，并给出替代方案',
      turns: [
        {
          partner: { en: "I think we should ship the whole thing in two weeks.", zh: '我觉得两周内把整个东西上线就行。' },
          goal: '先接住对方，再提出你的顾虑',
          hint: '"I see where you\'re coming from, but I have a concern about the timeline."',
          answers: [
            { en: "I see where you're coming from, but I have a concern about the timeline.", zh: '我理解你的思路，但我对排期有点顾虑。', keys: [['see', 'understand', 'get', 'coming'], ['but', 'however', 'though', 'concern'], ['timeline', 'schedule', 'time', 'two']] },
            { en: "That's a fair point. I'm just worried we're underestimating the testing.", zh: '有道理，我只是担心低估了测试工作量。', keys: [['fair', 'point', 'agree', 'true'], ['worried', 'concern', 'worry', 'underestimating'], ['testing', 'test', 'work', 'qa']] }
          ],
          coach: '先给一句 I see where you are coming from，转折才不会听起来像否定人。'
        },
        {
          partner: { en: "What exactly are you worried about?", zh: '你具体担心什么？' },
          goal: '给出一个具体、可验证的风险',
          hint: '说清「什么会出问题 / 会影响谁」，别只说感觉不靠谱。',
          answers: [
            { en: "The payment flow hasn't been tested on mobile yet, and that's our biggest risk.", zh: '支付流程还没在移动端测过，这是最大的风险。', keys: [['payment', 'flow', 'mobile', 'checkout'], ['tested', 'test', 'hasnt', 'not'], ['risk', 'biggest', 'issue', 'problem']] },
            { en: "We'd need at least a week for regression testing alone.", zh: '光回归测试就至少要一周。', keys: [['need', 'would', 'week', 'least'], ['regression', 'testing', 'test'], ['alone', 'only', 'at']] }
          ],
          coach: '把担忧落到「某个具体环节 + 具体时间/影响」，对方才能和你一起想办法。'
        },
        {
          partner: { en: "Okay, so what do you suggest instead?", zh: '好，那你建议怎么做？' },
          goal: '提出一个可执行的折中方案',
          hint: '"Could we ship the core flow first and move the rest to the next sprint?"',
          answers: [
            { en: "Could we ship the core flow first and move the rest to the next sprint?", zh: '能不能先上核心流程，其余放到下个迭代？', keys: [['could', 'we', 'can', 'suggest', 'how'], ['core', 'first', 'mvp', 'ship'], ['rest', 'sprint', 'next', 'later']] },
            { en: "I'd suggest a two-phase release, with a buffer week in between.", zh: '我建议分两期发布，中间留一周缓冲。', keys: [['suggest', 'would', 'propose', 'recommend'], ['two', 'phase', 'release', 'stages'], ['buffer', 'week', 'between']] }
          ],
          coach: '反对之后一定要带方案。Could we...? / I would suggest... 是最不冒犯的两种开头。'
        },
        {
          partner: { en: "That could work. Let's take it to the team.", zh: '这可行，我们拿到会上讨论吧。' },
          goal: '确认共识并主动承接下一步',
          hint: '"Agreed. I\'ll draft a short version before the meeting."',
          answers: [
            { en: "Agreed. I'll draft a short version before the meeting.", zh: '同意，会前我先起草一个简版。', keys: [['agreed', 'great', 'sounds', 'yes'], ['draft', 'write', 'prepare', 'i'], ['meeting', 'before', 'version', 'short']] },
            { en: "Sounds good. I'll put the risks and the plan on one slide.", zh: '好的，我把风险和方案整理成一页。', keys: [['sounds', 'good', 'great', 'ok'], ['put', 'write', 'prepare', 'slide'], ['risks', 'plan', 'one', 'together']] }
          ],
          coach: '达成共识后主动认领一个很小的动作，能避免方案散会在空气里。'
        }
      ]
    },
    {
      id: 'remote', title: '远程协作', en: 'Remote Collaboration', icon: 'code', color: '#334155', tint: '#EDF1F7',
      topics: ['tech', 'work'], level: 3,
      place: '跨时区协作，同事在另一个城市，你们用视频对齐一个线上问题', you: '工程师', partner: '同事 Sofia',
      goal: '对齐问题、说清已排查的部分、约定下一步',
      turns: [
        {
          partner: { en: "Hey, thanks for jumping on. Can you hear me okay?", zh: '嗨，谢谢你上线，能听清我说话吗？' },
          goal: '确认音视频没问题并切入正题',
          hint: '"Loud and clear. Shall we start with the checkout bug?"',
          answers: [
            { en: "Loud and clear. Shall we start with the checkout bug?", zh: '很清楚，我们从结算的问题开始？', keys: [['loud', 'clear', 'yes', 'hear'], ['shall', 'start', 'can', 'lets', 'should'], ['checkout', 'bug', 'issue', 'problem']] },
            { en: "Yes, you're coming through fine. Let's dig into the failed requests.", zh: '可以，听得很清楚，我们看看失败的请求吧。', keys: [['yes', 'fine', 'clear', 'hear'], ['lets', 'dig', 'look', 'start'], ['failed', 'requests', 'issue', 'error']] }
          ],
          coach: 'Loud and clear 是远程会议里「听得很清楚」的固定说法，比 I can hear you 自然。'
        },
        {
          partner: { en: "Great. So the deploy last night seems to have broken sign-in.", zh: '好，昨晚的发布好像把登录弄坏了。' },
          goal: '说明你已经排查到哪一步',
          hint: '"I\'ve checked the logs. It\'s not the database, it looks like a config issue."',
          answers: [
            { en: "I've checked the logs. It's not the database, it looks like a config issue.", zh: '我查过日志了，不是数据库，看起来是配置问题。', keys: [['checked', 'looked', 'reviewed', 'i'], ['logs', 'database', 'config', 'not'], ['config', 'issue', 'looks', 'environment']] },
            { en: "I can reproduce it on staging, but not locally.", zh: '我能在预发布环境复现，本地不行。', keys: [['reproduce', 'can', 'reproducing'], ['staging', 'locally', 'local', 'production'], ['but', 'not', 'only']] }
          ],
          coach: '同步排查结果时先说「已经排除了什么」，对方就不用重复劳动。'
        },
        {
          partner: { en: "Got it. Should we roll back or push a hotfix?", zh: '明白，我们该回滚还是发个热修复？' },
          goal: '给出判断并说明理由',
          hint: '"I\'d roll back first, then fix it properly in the morning."',
          answers: [
            { en: "I'd roll back first, then fix it properly in the morning.", zh: '我建议先回滚，明早再正式修。', keys: [['would', 'suggest', 'vote', 'roll'], ['roll', 'back', 'revert', 'first'], ['then', 'morning', 'fix', 'properly']] },
            { en: "Let's roll back now since sign-in affects everyone.", zh: '先回滚吧，登录影响所有用户。', keys: [['lets', 'roll', 'back', 'should'], ['now', 'since', 'because', 'first'], ['sign', 'everyone', 'affects', 'users']] }
          ],
          coach: '给建议时补一个 because / since 的理由，跨时区协作才不用再来回追问。'
        },
        {
          partner: { en: "Agreed. I'll handle the rollback on my side.", zh: '同意，我这边来做回滚。' },
          goal: '确认分工并约定同步时间点',
          hint: '"Thanks. I\'ll write a short postmortem and ping you in an hour."',
          answers: [
            { en: "Thanks. I'll write a short postmortem and ping you in an hour.", zh: '谢谢，我写个简短复盘，一小时后同步你。', keys: [['thank', 'thanks'], ['postmortem', 'write', 'notes', 'summary'], ['hour', 'ping', 'update', 'later']] },
            { en: "Perfect. Let's sync again once it's live.", zh: '好，恢复上线后我们再对一次。', keys: [['perfect', 'great', 'ok', 'sounds'], ['sync', 'check', 'again', 'lets'], ['once', 'live', 'when', 'after']] }
          ],
          coach: '远程协作最怕「没有下一次」。结束前一定约好同步的时间或触发条件。'
        }
      ]
    },
    {
      id: 'invite', title: '邀约与婉拒', en: 'Invitations & Saying No', icon: 'chat', color: '#8B5CF6', tint: '#F3EDFF',
      topics: ['social', 'opinion'], level: 2,
      place: '下班前，同事临时约你周五晚上聚餐，你已经有安排', you: '你自己', partner: '同事 Leo',
      goal: '得体地婉拒，并给出替代方案',
      turns: [
        {
          partner: { en: "Hey, a few of us are grabbing dinner on Friday. Want to join?", zh: '嗨，我们几个人周五去吃饭，一起吗？' },
          goal: '先表达兴趣，再说明去不了',
          hint: '"I\'d love to, but I already have plans on Friday."',
          answers: [
            { en: "I'd love to, but I already have plans on Friday.", zh: '我很想去，但周五已经有安排了。', keys: [['love', 'would', 'like', 'wish'], ['but', 'unfortunately', 'sorry', 'cant'], ['plans', 'busy', 'already', 'friday']] },
            { en: "That sounds great, but I'm afraid I can't make it this time.", zh: '听起来很棒，不过这次恐怕去不了。', keys: [['sounds', 'great', 'love', 'nice'], ['afraid', 'cant', 'but', 'sorry'], ['make', 'time', 'this', 'it']] }
          ],
          coach: '婉拒的标准结构：先肯定（I would love to）→ 转折 → 给理由，不要一上来就说 No。'
        },
        {
          partner: { en: "Aw, that's a shame. Everything okay?", zh: '哎呀真可惜，一切都还好吧？' },
          goal: '简单说明原因，别过度解释',
          hint: '"Yeah, all good! It\'s just a family thing."',
          answers: [
            { en: "Yeah, all good! It's just a family thing.", zh: '都挺好的，就是家里有点事。', keys: [['yeah', 'yes', 'good', 'fine'], ['good', 'okay', 'fine', 'all'], ['family', 'thing', 'just', 'dinner']] },
            { en: "Everything's fine, I've just got a prior commitment.", zh: '一切正常，只是之前已经有约了。', keys: [['everything', 'fine', 'good', 'okay'], ['just', 'prior', 'commitment', 'got'], ['fine', 'no', 'nothing']] }
          ],
          coach: '理由一句就够。解释越长越像在找借口，a family thing / a prior commitment 都很得体。'
        },
        {
          partner: { en: "No worries. Maybe next time then?", zh: '没事，那下次吧？' },
          goal: '主动提出一个具体的替代时间',
          hint: '"Definitely. Could we do lunch next week instead?"',
          answers: [
            { en: "Definitely. Could we do lunch next week instead?", zh: '一定，下周一起吃个午饭怎么样？', keys: [['definitely', 'sure', 'yes', 'absolutely'], ['lunch', 'coffee', 'dinner', 'do'], ['next', 'week', 'instead', 'time']] },
            { en: "For sure. Let's plan something for the following week.", zh: '当然，我们约下下周吧。', keys: [['sure', 'yes', 'definitely', 'for'], ['plan', 'lets', 'something', 'arrange'], ['following', 'week', 'next', 'later']] }
          ],
          coach: '只说 next time 等于没约。给出具体形式或时间，才是真的接受邀约。'
        },
        {
          partner: { en: "Sounds like a plan! I'll put it in the calendar.", zh: '就这么定！我记到日历里。' },
          goal: '收尾致谢并把气氛留住',
          hint: '"Thanks for thinking of me. Have fun on Friday!"',
          answers: [
            { en: "Thanks for thinking of me. Have fun on Friday!", zh: '谢谢你想到我，周五玩得开心！', keys: [['thank', 'thanks'], ['thinking', 'invite', 'asking', 'me'], ['fun', 'friday', 'have', 'enjoy']] },
            { en: "Appreciate it. Looking forward to next week!", zh: '谢谢，期待下周！', keys: [['appreciate', 'thank', 'thanks'], ['looking', 'forward', 'next'], ['week', 'see', 'you']] }
          ],
          coach: 'Thanks for thinking of me 是婉拒后很温暖的一句，能把关系留住。'
        }
      ]
    }
  ];

  function get(id) {
    for (var i = 0; i < SCENARIOS.length; i++) if (SCENARIOS[i].id === id) return SCENARIOS[i];
    return null;
  }

  /* ---------------- 沟通达成度评测 ---------------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function hasToken(tokens, word) {
    var k = SB.scoring.normalize(word);
    if (!k) return false;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i] === k) return true;
      if (k.length >= 4 && SB.scoring.similarity(tokens[i], k) >= 0.72) return true;
    }
    return false;
  }

  function matchAnswer(answer, candidate) {
    var tokens = SB.scoring.tokenize(candidate);
    var norm = SB.scoring.normalize(candidate);
    var groups = (answer.keys || []).map(function (g) {
      var words = [].concat(g);
      var hit = null;
      for (var i = 0; i < words.length; i++) {
        if (hasToken(tokens, words[i])) { hit = words[i]; break; }
      }
      return { label: words.join(' / '), ok: !!hit, hit: hit };
    });
    var satisfied = groups.filter(function (g) { return g.ok; }).length;
    var coverage = groups.length ? satisfied / groups.length : 0;
    var sim = SB.scoring.similarity(norm, SB.scoring.normalize(answer.en));
    return { answer: answer, groups: groups, coverage: coverage, sim: sim, value: 0.68 * coverage + 0.32 * sim };
  }

  function bestMatch(turn, candidate) {
    var best = null;
    (turn.answers || []).forEach(function (a) {
      var m = matchAnswer(a, candidate);
      if (!best || m.value > best.value) best = m;
    });
    return best;
  }

  function comboMultiplier(c) { return c >= 5 ? 2 : c >= 3 ? 1.5 : c >= 2 ? 1.2 : 1; }

  /**
   * 评估一轮对话。
   * @param turn 剧本中的一轮
   * @param input {transcript, alternatives, metrics, combo, fallback, allowDemo}
   */
  function evaluate(turn, input) {
    input = input || {};
    var metrics = input.metrics || {};
    var candidates = (input.alternatives || []).slice();
    if (input.transcript && candidates.indexOf(input.transcript) === -1) candidates.unshift(input.transcript);
    candidates = candidates.filter(function (c) { return SB.scoring.normalize(c).length > 0; });

    // 没识别到任何发音时不再拿参考说法冒充「你说得不错」，返回不计分结果让界面引导重录。
    // 只有用户主动选「体验模式 / 用参考说法继续」才走演示评分。
    if (!candidates.length && !input.allowDemo) {
      return {
        noSpeech: true,
        noSpeechReason: metrics.simulated ? 'recorder-unavailable' : 'no-transcript',
        total: 0, intent: 0, delivery: { total: 0 },
        groups: [], coverage: 0, reference: turn.answers || [],
        matched: turn.answers && turn.answers[0] ? turn.answers[0] : null,
        coach: turn.coach || '', transcript: '', fallback: false, demo: false,
        stars: 0, words: [], fluencyDetail: {}, diagnose: [],
        metrics: metrics, sentence: null, xp: 0, combo: 0,
        multiplier: 1, comboBonus: 0, turn: turn
      };
    }

    var fallback = !!input.fallback || !candidates.length;
    var spoken = fallback
      ? (turn.answers[0] ? turn.answers[0].en : '')
      : candidates[0];
    var chosen = null;
    candidates.forEach(function (c) {
      var m = bestMatch(turn, c);
      if (m && (!chosen || m.value > chosen.value)) { chosen = m; spoken = c; }
    });
    if (!chosen) chosen = bestMatch(turn, spoken) || { answer: turn.answers[0], groups: [], coverage: 0, sim: 0, value: 0 };
    var ref = chosen.answer || { en: spoken, zh: '', keys: [] };

    var tokens = SB.scoring.tokenize(spoken);
    var lengthPenalty = tokens.length < 2 ? 0.45 : tokens.length < 4 ? 0.85 : 1;
    // 非线性曲线：命中全部语义组给满分，只擦到一组时明显扣分，避免「随便说一句」也拿高分
    var intent = clamp(Math.round((0.28 + 0.72 * Math.pow(chosen.coverage, 1.35)) * 100 * (0.88 + 0.12 * chosen.sim) * lengthPenalty), 0, 100);
    if (fallback) intent = clamp(72 + Math.round(chosen.sim * 12), 0, 88);

    var pseudo = {
      id: 'dlg-' + (turn.partner ? SB.scoring.normalize(turn.partner.en).slice(0, 18) : 'x') + '-' + spoken.length,
      en: ref.en, zh: ref.zh || '', focus: [], ipa: '', key: '', tip: ''
    };
    var delivery = SB.scoring.score({
      sentence: pseudo,
      transcript: spoken,
      alternatives: candidates.length ? candidates : [spoken],
      metrics: metrics,
      combo: input.combo || 0,
      allowDemo: !!input.allowDemo
    });

    // 识别器偶尔会「幻听」出一两个词，但录音本身是静音/没有真实发音：
    // scoring 已经判成 noSpeech(total 0)。这里必须原样透出，绝不能再用
    // clamp(..., 30, 99) 的下限把它抬成及格的 30 分、还发 XP。
    if (delivery.noSpeech) {
      return {
        noSpeech: true,
        noSpeechReason: delivery.noSpeechReason,
        total: 0, intent: 0, delivery: delivery,
        groups: [], coverage: 0, reference: turn.answers || [],
        matched: turn.answers && turn.answers[0] ? turn.answers[0] : null,
        coach: turn.coach || '', transcript: '', fallback: false, demo: false,
        stars: 0, words: [], fluencyDetail: {}, diagnose: [],
        metrics: metrics, sentence: null, xp: 0, combo: 0,
        multiplier: 1, comboBonus: 0, turn: turn
      };
    }

    var total = clamp(Math.round(0.62 * intent + 0.38 * delivery.total), 30, 99);
    var demo = fallback || !!metrics.simulated || delivery.demo;
    var combo = total >= 80 ? (input.combo || 0) + 1 : 0;
    var multiplier = comboMultiplier(combo);
    var baseXp = total >= 90 ? 32 : total >= 75 ? 26 : total >= 60 ? 18 : 10;
    if (demo) baseXp = Math.round(baseXp * 0.5);
    var xp = Math.round(baseXp * multiplier);

    return {
      total: total,
      intent: intent,
      delivery: delivery,
      groups: chosen.groups,
      coverage: chosen.coverage,
      reference: turn.answers || [],
      matched: ref,
      coach: turn.coach || '',
      transcript: spoken,
      fallback: fallback,
      demo: demo,
      stars: SB.scoring.starsFor(total),
      words: delivery.words,
      fluencyDetail: delivery.fluencyDetail,
      diagnose: delivery.diagnose,
      metrics: metrics,
      sentence: pseudo,
      xp: xp,
      combo: combo,
      multiplier: multiplier,
      comboBonus: xp - baseXp,
      turn: turn
    };
  }

  /** 按兴趣话题 + 定级起点推荐场景（用于列表排序与「为你推荐」标记）。 */
  function scoreScenario(sc, topicIds, startStage) {
    var hits = (sc.topics || []).filter(function (t) { return topicIds.indexOf(t) !== -1; });
    var score = hits.length * 12;
    if (hits.length && sc.topics[0] === topicIds[0]) score += 8;
    if (sc.topics[0] && topicIds.indexOf(sc.topics[0]) !== -1) score += 6;
    var diff = Math.abs((sc.level || 1) - (startStage || 2));
    score += diff === 0 ? 10 : diff === 1 ? 3 : -4;
    return { score: score, recommended: hits.length > 0, levelFit: diff === 0 };
  }

  SB.dialogue = {
    scenarios: SCENARIOS,
    totalTurns: SCENARIOS.reduce(function (n, s) { return n + s.turns.length; }, 0),
    get: get,
    evaluate: evaluate,
    scoreScenario: scoreScenario,
    matchAnswer: matchAnswer
  };
})(window);
