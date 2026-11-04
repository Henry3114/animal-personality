const { ANIMALS, ANIMAL_MAP, QUESTIONS, WEIGHT } = require('../data.js');

/**
 * answers: { 1:'牛', 2:'猴', 3:'羊', 4:'马', 5:'狮', 6:'牛' }
 * 返回：每个动物的得分、主导、底色、组合名、放弃顺序
 */
function computeResult(answers) {
  const score = {};
  ANIMALS.forEach(a => { score[a.name] = 0; });

  const given = [answers[1], answers[2], answers[3]];
  given.forEach((name, i) => {
    if (name) score[name] += [WEIGHT.give1, WEIGHT.give2, WEIGHT.give3][i];
  });

  const taken = answers[4];
  if (taken) {
    score[taken] += WEIGHT.taken;
    ANIMALS.forEach(a => {
      if (a.name !== taken && !given.includes(a.name)) score[a.name] += WEIGHT.left;
    });
  }

  [answers[5], answers[6]].forEach(n => { if (n) score[n] += WEIGHT.bonus; });

  const order = ANIMALS.map(a => ({ name: a.name, score: score[a.name] }))
    .sort((x, y) => y.score - x.score);

  // 并列裁决：主导看分数，同分时看第 6 题（最舍不得）
  const primary = order[0].name;
  let secondary = order[1].name;
  if (order[0].score === order[1].score) {
    const tie = order.filter(o => o.score === order[0].score).map(o => o.name);
    const byLast = tie.includes(answers[6]) ? answers[6] : tie[0];
    order.sort((x, y) => (x.name === byLast ? -1 : y.name === byLast ? 1 : y.score - x.score));
    return build(order[0].name, order[1].name, score, order, given, taken);
  }
  return build(primary, secondary, score, order, given, taken);
}

function build(primary, secondary, score, order, given, taken) {
  const p = ANIMAL_MAP[primary], s = ANIMAL_MAP[secondary];
  return {
    primary, secondary, score, order, given, taken,
    comboName: `${p.name}·${s.name}`,
    comboLabel: `${p.role}为主，${s.role}为底`
  };
}

module.exports = { computeResult };

/* ---------- 自检：穷举全部作答路径 ---------- */
if (require.main === module) {
  const names = ANIMALS.map(a => a.name);
  const combos = {};
  let total = 0;
  const scoreRange = {};

  for (const g1 of names) {
    for (const g2 of names.filter(n => n !== g1)) {
      for (const g3 of names.filter(n => n !== g1 && n !== g2)) {
        const rest = names.filter(n => ![g1, g2, g3].includes(n));
        for (const t of rest) {
          for (const b5 of names) {
            for (const b6 of names) {
              const r = computeResult({ 1: g1, 2: g2, 3: g3, 4: t, 5: b5, 6: b6 });
              combos[r.comboName] = (combos[r.comboName] || 0) + 1;
              total++;
              if (r.primary === r.secondary) console.log('异常：主导=底色', r);
              Object.values(r.score).forEach(v => {
                scoreRange[v] = (scoreRange[v] || 0) + 1;
              });
            }
          }
        }
      }
    }
  }

  const keys = Object.keys(combos).sort();
  console.log('总路径:', total);
  console.log('可达组合数:', keys.length, '/ 20');
  console.log('缺失组合:', ["狮·马", "狮·牛", "狮·羊", "狮·猴", "马·狮", "马·牛", "马·羊", "马·猴", "牛·狮", "牛·马", "牛·羊", "牛·猴", "羊·狮", "羊·马", "羊·牛", "羊·猴", "猴·狮", "猴·马", "猴·牛", "猴·羊"].filter(k => !combos[k]));
  const vals = Object.values(combos);
  console.log('组合出现次数 最少/最多:', Math.min(...vals), '/', Math.max(...vals));
  console.log('得分取值范围:', Math.min(...Object.keys(scoreRange).map(Number)), '-', Math.max(...Object.keys(scoreRange).map(Number)));
  console.log('示例：狮·马型占比', (combos['狮·马'] / total * 100).toFixed(2) + '%');
}
