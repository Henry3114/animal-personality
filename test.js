/* 答题页逻辑 */
(function () {
  'use strict';

  var GATE_ON = true;
  var KEY_GATE = 'ap_gate';
  var KEY_ANSW = 'ap_answers';

  // 未过门禁 → 回封面
  if (GATE_ON) {
    var ok = false;
    try { ok = sessionStorage.getItem(KEY_GATE) === '1'; } catch (e) {}
    if (!ok) { location.replace('index.html'); return; }
  }

  var state = { step: 0, answers: {} };
  var total = QUESTIONS.length;

  var elCur = document.getElementById('cur');
  var elStage = document.getElementById('stageLabel');
  var elBar = document.getElementById('bar');
  var elQ = document.getElementById('qText');
  var elHint = document.getElementById('qHint');
  var elOpts = document.getElementById('options');
  var elWrap = document.getElementById('qwrap');

  var STAGE_LABEL = { give: '放弃', take: '带走', bonus: '回想' };
  var locked = false;

  function deadList() {
    // 前 3 题已放弃的动物
    return [state.answers[1], state.answers[2], state.answers[3]].filter(Boolean);
  }

  function render() {
    var q = QUESTIONS[state.step];
    locked = false;

    elCur.textContent = state.step + 1;
    elStage.textContent = STAGE_LABEL[q.stage] || '';
    elBar.style.width = ((state.step) / total * 100) + '%';

    elQ.textContent = q.text;
    elHint.textContent = q.hint || '';

    var dead = (q.stage === 'give' || q.stage === 'take') ? deadList() : [];

    elOpts.innerHTML = '';
    ANIMALS.forEach(function (a) {
      var isDead = dead.indexOf(a.name) > -1;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt' + (isDead ? ' dead' : '');
      b.setAttribute('aria-label', (isDead ? '已放弃的 ' : '选择 ') + a.name);
      b.innerHTML = '<div class="av"><img src="assets/animals/clean/' + a.id + '.webp" alt=""></div>' +
                    '<span class="opt-name">' + a.name + '</span>';
      if (!isDead) {
        b.addEventListener('click', function () { pick(a.name, b); });
      }
      elOpts.appendChild(b);
    });

    // 入场动画
    elWrap.classList.remove('fade-in');
    void elWrap.offsetWidth;
    elWrap.classList.add('fade-in');
  }

  function pick(name, btn) {
    if (locked) return;
    locked = true;

    btn.classList.add('picked');
    state.answers[QUESTIONS[state.step].id] = name;

    setTimeout(function () {
      if (state.step + 1 < total) {
        state.step++;
        render();
      } else {
        finish();
      }
    }, 210);
  }

  function finish() {
    elBar.style.width = '100%';
    try {
      localStorage.setItem(KEY_ANSW, JSON.stringify(state.answers));
    } catch (e) {
      alert('浏览器禁用了本地存储，结果无法保存。请关闭无痕模式后重试。');
      return;
    }
    elQ.textContent = '正在读你的选择…';
    elHint.textContent = '';
    elOpts.innerHTML = '';
    setTimeout(function () { location.href = 'result.html'; }, 520);
  }

  render();
})();
