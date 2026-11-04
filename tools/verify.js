const { ANIMALS, COMBOS, QUESTIONS, computeResult } = require('../data.js');

// 1. 组合文案完整性
const need = [];
ANIMALS.forEach(p => ANIMALS.forEach(s => { if (p.name !== s.name) need.push(p.name + '·' + s.name); }));
const missing = need.filter(k => !COMBOS[k]);
const extra = Object.keys(COMBOS).filter(k => need.indexOf(k) === -1);
console.log('组合应为', need.length, '实有', Object.keys(COMBOS).length, '缺失', missing.length, missing.join(','));
console.log('多余键:', extra.length);

// 2. 穷举全部作答路径
const names = ANIMALS.map(a => a.name);
const combos = {};
let total = 0;
const wins = {};

for (const g1 of names) for (const g2 of names.filter(n => n !== g1))
  for (const g3 of names.filter(n => n !== g1 && n !== g2)) {
    const rest = names.filter(n => [g1, g2, g3].indexOf(n) === -1);
    for (const t of rest) for (const b5 of names) for (const b6 of names) {
      const r = computeResult({ 1: g1, 2: g2, 3: g3, 4: t, 5: b5, 6: b6 });
      combos[r.key] = (combos[r.key] || 0) + 1;
      wins[r.primary] = (wins[r.primary] || 0) + 1;
      total++;
      if (r.primary === r.secondary) throw new Error('主导=底色');
    }
  }

console.log('路径总数:', total);
console.log('可达组合:', Object.keys(combos).length, '/ 20');
console.log('每组合最少/最多次:', Math.min(...Object.values(combos)), '/', Math.max(...Object.values(combos)));
console.log('主导分布:', Object.entries(wins).map(([k, v]) => k + ' ' + (v / total * 100).toFixed(1) + '%').join('  '));

// 3. 边界：全放弃同一只的顺序（不可能，UI 会禁止），但传进来也要不崩
console.log('异常输入不崩:', !!computeResult({ 1: '牛', 2: '牛', 3: '牛', 4: '牛', 5: '牛', 6: '牛' }));
console.log('空输入不崩:', !!computeResult({}));
