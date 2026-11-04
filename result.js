/* 结果页：渲染 + Canvas 长图导出 */
(function () {
  'use strict';

  var KEY_ANSW = 'ap_answers';

  /* ===== 读取答案 ===== */
  var answers = null;
  try { answers = JSON.parse(localStorage.getItem(KEY_ANSW) || 'null'); } catch (e) {}
  if (!answers || !answers[1]) { location.replace('index.html'); return; }

  var r = computeResult(answers);

  /* ===== 填充页面 ===== */
  document.getElementById('resName').textContent = r.animal.name + ' · ' + r.base.name;
  document.getElementById('resRole').textContent = r.animal.role + ' · ' + r.animal.tag;
  document.getElementById('resImg').src = 'assets/animals/clean/' + r.animal.id + '.webp';
  document.getElementById('resImg').alt = r.animal.name;
  document.getElementById('comboTitle').textContent = r.combo.title;
  document.getElementById('comboLine').textContent = r.combo.line;
  document.getElementById('desc').textContent = r.animal.desc;
  document.getElementById('stress').textContent = r.animal.stress;
  document.getElementById('advice').textContent = r.animal.advice;
  document.getElementById('baseLine').textContent =
    '底色是' + r.base.name + '（' + r.base.role + '）——' + r.base.tag +
    '。它不像主导的那只那么显眼，但你做决定时的第一反应，常常是它。';

  fillList('strengths', r.animal.strengths);
  fillList('blind', r.animal.blind);

  function fillList(id, arr) {
    var ul = document.getElementById(id);
    ul.innerHTML = '';
    arr.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
  }

  /* ===== 放弃顺序 ===== */
  (function () {
    var wrap = document.getElementById('trail');
    var seq = r.given.concat([r.taken]).filter(Boolean);
    seq.forEach(function (name, i) {
      if (i) {
        var ar = document.createElement('span');
        ar.className = 'trail-arrow';
        ar.textContent = '→';
        wrap.appendChild(ar);
      }
      var n = document.createElement('span');
      n.className = 'trail-node';
      n.textContent = name;
      wrap.appendChild(n);
    });
  })();

  /* ===== 按钮 ===== */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  document.getElementById('againBtn').addEventListener('click', function () {
    localStorage.removeItem(KEY_ANSW);
    location.href = 'test.html';
  });

  /* ============================================================
     Canvas 长图
     ============================================================ */
  var CW = 1242;
  var PAD = 100;
  var INK = '#16232F';
  var INK2 = '#3D5870';
  var INK3 = '#8399AB';
  var PAPER = '#FAF7F0';
  var ACCENT = '#B5502E';

  var SERIF = '"Songti SC","STSong","SimSun",serif';
  var SANS = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';

  function wrapText(ctx, text, maxW) {
    var lines = [];
    var line = '';
    var noStart = '，。、；：？！）」』】…·%,.!?:;)';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        // 行首禁则：标点不放在行首，挪到上一行
        if (noStart.indexOf(ch) > -1) {
          lines.push(line + ch);
          line = '';
          continue;
        }
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawCard(img, cb) {
    var c = document.createElement('canvas');
    c.width = CW;
    c.height = 4200;
    var ctx = c.getContext('2d');

    var maxW = CW - PAD * 2;
    var y = 0;

    // 底色
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, CW, c.height);

    // 顶部淡蓝灰氛围
    var g = ctx.createLinearGradient(0, 0, 0, 560);
    g.addColorStop(0, 'rgba(198, 218, 232, .55)');
    g.addColorStop(1, 'rgba(250, 247, 240, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, 560);

    // 顶部小字
    y = 132;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK3;
    ctx.font = '32px ' + SANS;
    ctx.fillText('动 物 原 型 人 格 测 试', CW / 2, y);

    // 组合名
    y += 188;
    ctx.fillStyle = INK;
    ctx.font = '700 150px ' + SERIF;
    ctx.fillText(r.animal.name + ' · ' + r.base.name, CW / 2, y);

    // 角色
    y += 96;
    ctx.fillStyle = INK2;
    ctx.font = '38px ' + SANS;
    ctx.fillText(r.animal.role + ' · ' + r.animal.tag, CW / 2, y);

    // 动物图
    y += 40;
    if (img && img.complete && img.naturalWidth) {
      var ih = 360;
      var iw = img.naturalWidth * (ih / img.naturalHeight);
      if (iw > maxW * 0.8) { iw = maxW * 0.8; ih = img.naturalHeight * (iw / img.naturalWidth); }
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(img, (CW - iw) / 2, y, iw, ih);
      ctx.globalCompositeOperation = 'source-over';
      y += ih;
    } else {
      y += 360;
    }

    // 组合标题
    y += 108;
    ctx.fillStyle = INK;
    ctx.font = '700 54px ' + SERIF;
    var tl = wrapText(ctx, r.combo.title, maxW);
    tl.forEach(function (ln, i) { ctx.fillText(ln, CW / 2, y + i * 76); });
    y += (tl.length - 1) * 76;

    // 组合正文
    y += 74;
    ctx.fillStyle = INK2;
    ctx.font = '38px ' + SANS;
    ctx.textAlign = 'left';
    var bl = wrapText(ctx, r.combo.line, maxW);
    bl.forEach(function (ln, i) { ctx.fillText(ln, PAD, y + i * 66); });
    y += (bl.length - 1) * 66;

    // 分割线
    y += 76;
    line(ctx, y);
    y += 26;

    // 标题 + 段落工具
    function section(label, bodyLines, opt) {
      opt = opt || {};
      y += 62;
      ctx.textAlign = 'left';
      ctx.fillStyle = INK3;
      ctx.font = '29px ' + SANS;
      ctx.fillText(label, PAD, y);
      y += 60;

      if (opt.bullets) {
        ctx.font = '37px ' + SANS;              // 测量与绘制必须同字体
        bodyLines.forEach(function (t) {
          var ls = wrapText(ctx, t, maxW - 36);
          ls.forEach(function (ln, i) {
            if (i === 0) {
              ctx.fillStyle = opt.warn ? ACCENT : INK3;
              ctx.beginPath();
              ctx.arc(PAD + 9, y - 12, 5.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = INK;
            ctx.font = '37px ' + SANS;
            ctx.fillText(ln, PAD + 36, y);
            y += 62;
          });
          y += 12;
        });
      } else {
        ctx.font = '37px ' + SANS;
        var all = [];
        bodyLines.forEach(function (t) {
          wrapText(ctx, t, maxW).forEach(function (ln) { all.push(ln); });
        });
        ctx.fillStyle = INK;
        ctx.font = '37px ' + SANS;
        all.forEach(function (ln) {
          ctx.fillText(ln, PAD, y);
          y += 66;
        });
      }
    }

    section('你 是 这 样 的 人', [r.animal.desc]);
    section('核 心 优 势', r.animal.strengths, { bullets: true });
    section('可 能 会 绊 住 你 的', r.animal.blind, { bullets: true, warn: true });
    section('撑 不 住 的 时 候', [r.animal.stress]);
    section('给 你 的 建 议', [r.animal.advice]);

    // 放弃顺序
    y += 76;
    line(ctx, y);
    y += 44;
    ctx.fillStyle = INK3;
    ctx.font = '30px ' + SANS;
    ctx.textAlign = 'left';
    ctx.fillText('你 放 弃 它 们 的 顺 序', PAD, y);
    y += 66;

    var seq = r.given.concat([r.taken]).filter(Boolean);
    var px = PAD;
    ctx.font = '38px ' + SANS;
    seq.forEach(function (name, i) {
      if (i) {
        ctx.fillStyle = INK3;
        ctx.fillText('→', px, y);
        px += ctx.measureText('→').width + 20;
      }
      var w = ctx.measureText(name).width + 52;
      ctx.fillStyle = (i === seq.length - 1) ? INK : 'rgba(22,35,47,.075)';
      roundRect(ctx, px, y - 40, w, 62, 31);
      ctx.fill();
      ctx.fillStyle = (i === seq.length - 1) ? PAPER : INK2;
      ctx.textAlign = 'center';
      ctx.fillText(name, px + w / 2, y + 4);
      ctx.textAlign = 'left';
      px += w + 18;
    });
    y += 60;

    // 底部
    y += 134;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK3;
    ctx.font = '28px ' + SANS;
    ctx.fillText('— 没有标准答案，也没有更好的动物 —', CW / 2, y);

    y += 48;
    ctx.fillStyle = '#A9B8C4';
    ctx.font = '26px ' + SANS;
    ctx.fillText('20 种动物人格原型 · 自我探索参考', CW / 2, y);

    // 裁剪
    var realH = Math.min(c.height, y + 108);
    var out = document.createElement('canvas');
    out.width = CW;
    out.height = realH;
    out.getContext('2d').drawImage(c, 0, 0, CW, realH, 0, 0, CW, realH);

    cb(out);
  }

  function line(ctx, y) {
    ctx.strokeStyle = 'rgba(22,35,47,.13)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(CW - PAD, y);
    ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  /* ===== 保存 ===== */
  var saveBtn = document.getElementById('saveBtn');
  saveBtn.addEventListener('click', function () {
    saveBtn.disabled = true;
    saveBtn.textContent = '正在生成…';

    var img = new Image();
    img.onload = img.onerror = function () {
      try {
        drawCard(img, function (canvas) {
          canvas.toBlob(function (blob) {
            if (!blob) { fail(); return; }
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = '动物原型_' + r.key + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

            saveBtn.disabled = false;
            saveBtn.textContent = '保存结果图';
            showToast('已保存到「下载」，长按图片可发小红书写笔记');
          });
        });
      } catch (e) {
        console.error(e);
        fail();
      }
    };
    img.src = 'assets/animals/clean/' + r.animal.id + '.webp';

    function fail() {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存结果图';
      showToast('生成失败，请截图保存本页');
    }
  });
})();
