/* 动物原型人格测试 · 数据层
 * 5 只动物固定选项 + 6 道情境题（3 轮放弃 / 1 轮带走 / 2 题参考）
 * 结果：主导动物 5 种 × 底色动物 4 种 = 20 种组合原型
 */

var ANIMALS = [
  {
    id: 'lion', name: '狮', role: '掌控者',
    tag: '不能把决定权交出去的人',
    desc: '你身上有一种压不住的存在感。事情乱的时候，你会本能地站出来，不是因为你想表现，而是因为没人站你会难受。你怕的不是失败，是失控——局面不在你手里，你就坐不住。',
    strengths: ['关键时刻敢拍板', '扛得住压力，不怕背责任', '气场足，别人愿意跟着你'],
    blind: ['太要掌控，听不进异议', '把「我能扛」当成不用求助', '失控时容易变得强硬'],
    stress: '一个人关起门硬扛，越扛越冷，然后怪没人懂',
    advice: '每周说一次「这事我需要你」；把授权当能力练，不是失控。'
  },
  {
    id: 'horse', name: '马', role: '奔跑者',
    tag: '被框住就想跑的人',
    desc: '你受不了被困住。规则太多、节奏太慢、话太绕，你都会想跑。你行动力强，想到就做，做完再想。你热情，来得快，也容易被新东西带走。你要的不是赢，是「不被拦着」。',
    strengths: ['行动力强，说干就干', '坦率，不藏着掖着', '恢复快，摔了还能再跑'],
    blind: ['冲动，先做后想', '受不了约束，难以长期深耕', '热情转移快，收尾差'],
    stress: '用忙碌和换环境盖住焦虑，越跑越远，问题还在原地',
    advice: '重要决定强制隔夜再定；选一件事跑到终点，再谈下一个。'
  },
  {
    id: 'ox', name: '牛', role: '实干者',
    tag: '用做完来说话的人',
    desc: '你不争，也不解释。你把事做完，比什么都有说服力。你相信积累——今天多做的这一点，日后都会算数。别人在讨论，你在做；别人在换方向，你还在做。你的可靠不是性格，是习惯。',
    strengths: ['执行力强，交给你就放心', '能吃苦，扛得住重复', '不邀功，踏实'],
    blind: ['只低头不看路，方向错了也走很远', '不会表达，功劳容易被拿走', '太能忍，忍到身体报警'],
    stress: '不说话，活照干，直到某天突然倒下或者递辞呈',
    advice: '每个季度抬头看一次方向；把成果说出来，不是炫耀，是校准。'
  },
  {
    id: 'sheep', name: '羊', role: '守护者',
    tag: '先看别人好不好的人',
    desc: '你身上有一种让人放松的东西。你不争抢，不锋利，跟谁都能处。你在意关系的和睦，愿意为了不撕破脸而退一步。你不是没有主见，你只是觉得「没必要」。你的温柔是真的，你的委屈也是真的。',
    strengths: ['亲和力强，谁都能处', '善于配合，团队的润滑剂', '心软，能让人放下防备'],
    blind: ['太怕冲突，长期委屈自己', '随大流，主见被磨掉', '边界模糊，容易被占便宜'],
    stress: '谁说什么都点头，不问去哪，心里越来越空',
    advice: '练习一次「我不同意」；分清「合群」和「丢自己」。'
  },
  {
    id: 'monkey', name: '猴', role: '机敏者',
    tag: '受不了无聊的人',
    desc: '你的注意力像风，来得快去得也快。你对新鲜的东西有本能的兴奋，学什么都快，丢得也快。你擅长在人群里找乐子，也擅长在僵局里找到一个谁都没想到的破口。你不是不认真，你只是受不了无聊。',
    strengths: ['学得快，上手就懂', '灵活，僵局里能变通', '有趣，跟你在一起不闷'],
    blind: ['三分钟热度，开头多结尾少', '用玩笑回避真正的问题', '坐不住，深度不够'],
    stress: '同时开很多事，越忙越乱，越乱越不敢停',
    advice: '选一件事做满 90 天；玩笑之后补一句真话。'
  }
];

var ANIMAL_MAP = {};
ANIMALS.forEach(function (a) { ANIMAL_MAP[a.name] = a; });

/* 20 组组合文案：主导 × 底色 */
var COMBOS = {
  '狮·马': { title: '你掌权，但不耐烦', line: '你开局最猛，也最想快点结束。你能把一盘散沙捏成队形，可一旦局面稳了，你的注意力就飘到下一件事上。你最怕的不是难，是慢。' },
  '狮·牛': { title: '你是最能扛的那种掌控者', line: '别人扛不住的你扛，别人不愿做的脏活你也做。你从不说累，所以没人知道你累。你要的不是被崇拜，是这件事别砸。' },
  '狮·羊': { title: '你强势，但心软', line: '你能拍板，却在执行时总替人留余地。你嘴上说「就这么定」，手上又多干了一份。你的强硬是给外面看的，你的让步只留给身边的人。' },
  '狮·猴': { title: '你最会带节奏', line: '你控场不靠压，靠把气氛调对。你能让一群人自愿跟着走，也容易用玩笑把真正的问题绕过去——绕久了，问题会回来找你。' },

  '马·狮': { title: '你既要自由，又要说了算', line: '你起步最快，也最容易跟人硬碰。你不接受被安排，同时希望别人听你的。这两件事很难同时成立，你一直在试。' },
  '马·牛': { title: '你能跑，也能扛', line: '你是少见的既能冲又能守的人。想跑的时候，你会先把手里的事收干净再走——这是你的分寸，也是你比同龄人稳的原因。' },
  '马·羊': { title: '你走得快，但会回头看', line: '你跑在前面，还会回头数有没有人掉队。这是你的软肋，也是你被人记住的原因。你常常因为等一个人，耽误了自己的路。' },
  '马·猴': { title: '你身上全是即兴', line: '点子多，热闹，转换快。你能把沉闷的场合救活，也常常留下一堆没做完的开头。你不缺开始的能力，缺的是收尾。' },

  '牛·狮': { title: '你不出声，但没人敢越过去', line: '你平时最安静，真到关头却最硬。你不解释，也不争辩，你把事做完，让结果替你说话。你的权威是攒出来的，不是喊出来的。' },
  '牛·马': { title: '你熬得住，也会突然推翻一切', line: '你能长期做一件事，也会在某个瞬间全部推倒重来。别人看不懂，你自己清楚——你不是忍够了，你是终于想通了。' },
  '牛·羊': { title: '你最能扛，也最不会拒绝', line: '别人开口你就接，接到某天撑不住。你以为这是善良，其实是你不敢让人失望。你的可靠正在被当成理所当然。' },
  '牛·猴': { title: '你表面最老实，脑子最快', line: '规矩你都懂，只是不想说破。你用最稳的方式做事，用最活的方式看人。别人以为你好拿捏，其实你早就看完了整局。' },

  '羊·狮': { title: '你退让，但底线一旦被踩会翻脸', line: '你平时什么都好说，可有些事你一次都不会让。你的爆发往往让人措手不及，因为他们从没见过你算账——你其实一直在算。' },
  '羊·马': { title: '你温和，但坐不住', line: '你不争，是因为你已经在心里跑远了。你看起来最配合，实际上最需要空间。你离开的时候不会吵，只会慢慢不出现。' },
  '羊·牛': { title: '你从不拒绝，所以被依赖', line: '你稳、可靠、从不添麻烦。所有人都觉得找你最省事。你的好脾气让你被需要，也让你被消耗——这两件事在别人眼里是一件事。' },
  '羊·猴': { title: '你在人群里最热闹，回家最空', line: '你照顾所有人的情绪，唯独不照顾自己。你能察觉谁不开心，却从不承认自己也不开心。你的热闹是给别人的，安静才是你的。' },

  '猴·狮': { title: '你最会玩，也最会控场', line: '你的强势是笑着的，别人常常反应不过来就已经跟着你走了。你不需要拍桌子，你只需要让大家觉得跟着你比较有意思。' },
  '猴·马': { title: '你好奇心最重，跑得最快', line: '你能同时开五件事，然后一件都没收。你不缺热情，缺的是允许自己无聊。你的下一次出发，往往是因为上一次没走完。' },
  '猴·牛': { title: '你看着最跳，其实最能熬', line: '你会用玩笑把苦事做完。别人以为你不认真，其实你在用最不正经的方式，做最正经的坚持。' },
  '猴·羊': { title: '你哄所有人，除了自己', line: '你最能活跃气氛，也最能察觉谁不开心。你把所有人的情绪都接住了，却没人问过你今天怎么样。你笑着说没事的时候，是真的有事。' }
};

/* 六道题：选项永远是这 5 只，已放弃的置灰不可选 */
var QUESTIONS = [
  { id: 1, stage: 'give', text: '你与五只动物在沙漠里共生。想走出沙漠，必须放弃其中一只——你会放弃谁？', hint: '点一下你要放弃的那一只' },
  { id: 2, stage: 'give', text: '你们继续走。又到一个必须放弃一只的关口——这次放弃谁？', hint: '已被放弃的不会再出现' },
  { id: 3, stage: 'give', text: '绿洲的水已经干涸。还要再放弃一只——放弃谁？', hint: '还剩三只' },
  { id: 4, stage: 'take', text: '只剩两只了。走出沙漠前，你只能带一只离开——你带谁？', hint: '另一只会留在沙漠里' },
  { id: 5, stage: 'bonus', text: '如果现在下一场雨，五只都能活下来。你最想先把水递给谁？', hint: '这题不打分，只作参考' },
  { id: 6, stage: 'bonus', text: '走出沙漠之后，你回头看了一眼。最舍不得的是谁？', hint: '最后一题' }
];

/* 权重：越晚放弃越重要 */
var WEIGHT = { give: [1, 2, 3], left: 4, taken: 5, bonus: 1 };

/* 计分：answers = {1:'牛',2:'猴',3:'羊',4:'马',5:'狮',6:'牛'} */
function computeResult(answers) {
  var score = {};
  ANIMALS.forEach(function (a) { score[a.name] = 0; });

  var given = [answers[1], answers[2], answers[3]].filter(Boolean);
  given.forEach(function (name, i) {
    if (score[name] !== undefined) score[name] += WEIGHT.give[i];
  });

  var taken = answers[4];
  if (taken && score[taken] !== undefined) {
    score[taken] += WEIGHT.taken;
    ANIMALS.forEach(function (a) {
      if (a.name !== taken && given.indexOf(a.name) === -1) score[a.name] += WEIGHT.left;
    });
  }

  [answers[5], answers[6]].forEach(function (n) {
    if (n && score[n] !== undefined) score[n] += WEIGHT.bonus;
  });

  var order = ANIMALS.map(function (a) {
    return { name: a.name, score: score[a.name] };
  }).sort(function (x, y) { return y.score - x.score; });

  // 并列裁决：最高分并列时，优先取第 6 题「最舍不得」那只
  var topScore = order[0].score;
  var tie = order.filter(function (o) { return o.score === topScore; }).map(function (o) { return o.name; });
  if (tie.length > 1) {
    var byLast = tie.indexOf(answers[6]) > -1 ? answers[6] : tie[0];
    order.sort(function (x, y) {
      var wx = (x.name === byLast) ? 1 : 0;
      var wy = (y.name === byLast) ? 1 : 0;
      if (wx !== wy) return wy - wx;
      return y.score - x.score;
    });
  }

  var p = order[0].name, s = order[1].name;
  var key = p + '·' + s;

  return {
    primary: p, secondary: s, key: key,
    score: score, order: order, given: given, taken: taken,
    combo: COMBOS[key] || { title: '', line: '' },
    animal: ANIMAL_MAP[p],
    base: ANIMAL_MAP[s]
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANIMALS: ANIMALS, ANIMAL_MAP: ANIMAL_MAP, COMBOS: COMBOS, QUESTIONS: QUESTIONS, WEIGHT: WEIGHT, computeResult: computeResult };
}
