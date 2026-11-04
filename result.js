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
  document.getElementById('resImg').src = 'assets/animals/cute/' + r.animal.id + '.webp';
  document.getElementById('resImg').alt = r.animal.name;
  document.getElementById('comboTitle').textContent = r.combo.title;
  document.getElementById('comboLine').textContent = r.combo.line;
  document.getElementById('desc').textContent = r.animal.desc;
  document.getElementById('stress').textContent = r.animal.stress;
  document.getElementById('advice').textContent = r.animal.advice;
  var baseText = '底色是' + r.base.name + '（' + r.base.role + '）——' + r.base.tag +
    '。它不像主导的那只那么显眼，但你做决定时的第一反应，常常是它。';
  document.getElementById('baseLine').textContent = baseText;

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
  var MARGIN = 62;
  var CARD_W = CW - MARGIN * 2;
  var PAD = 54;
  var TEXT_W = CARD_W - PAD * 2;
  var GAP = 18;

  var CREAM = '#FDF7F0';
  var CARD = '#FFFFFF';
  var INK = '#3A342D';
  var INK2 = '#6E6358';
  var INK3 = '#A2958A';
  var ORANGE = '#D9784A';
  var ORANGE_SOFT = '#FCEEE2';
  var DOT = '#F0A66F';
  var DOT_WARN = '#E6A78C';
  var LINE = '#F2E6D9';

  var SANS = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';

  var TITLE_TOP = 52;      // 标题距卡片顶
  var DIVIDER_Y = 118;     // 分割线距卡片顶
  var FIRST_LINE = 30;     // 首行基线距分割线
  var BOTTOM = 54;         // 末行基线距卡片底

  function wrapText(ctx, text, maxW) {
    var lines = [];
    var line = '';
    var noStart = '，。、；：？！）」』】…·%,.!?:;)';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
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

  function roundRect(ctx, x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function cardBg(ctx, x, y, w, h, rad) {
    ctx.save();
    ctx.shadowColor = 'rgba(184, 137, 96, .18)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = CARD;
    roundRect(ctx, x, y, w, h, rad);
    ctx.fill();
    ctx.restore();
  }

  /* 段落卡：先量后排 */
  function measureSec(ctx, s) {
    var maxW = s.bullets ? TEXT_W - 34 : TEXT_W;
    var lh = s.bullets ? 62 : 60;
    var gap = s.bullets ? 12 : 20;
    ctx.font = '36px ' + SANS;
    var items = s.body.map(function (t) { return wrapText(ctx, t, maxW); });
    var contentH = 0;
    items.forEach(function (ls, i) {
      if (i > 0) contentH += gap;
      contentH += ls.length * lh;
    });
    var h = DIVIDER_Y + FIRST_LINE + contentH - lh + BOTTOM;
    return { items: items, h: h, lh: lh, gap: gap };
  }

  function drawCard(img, cb) {
    var c = document.createElement('canvas');
    c.width = CW;
    c.height = 5600;
    var ctx = c.getContext('2d');

    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, CW, c.height);

    // 顶部暖光
    var glow = ctx.createRadialGradient(CW / 2, -140, 40, CW / 2, -140, 900);
    glow.addColorStop(0, '#FFF3E4');
    glow.addColorStop(1, 'rgba(255,243,228,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CW, 760);

    // ---- 头部头像 ----
    var cx = CW / 2, cy = 244, rad = 112;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = ORANGE_SOFT;
    ctx.fill();

    if (img && img.complete && img.naturalWidth) {
      var ih = 208;
      var iw = img.naturalWidth * (ih / img.naturalHeight);
      if (iw > rad * 1.62) { iw = rad * 1.62; ih = img.naturalHeight * (iw / img.naturalWidth); }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
      ctx.restore();
    }

    // ---- 标题 ----
    var y = cy + rad + 78;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK3;
    ctx.font = '600 30px ' + SANS;
    ctx.fillText('你 的 动 物 原 型', CW / 2, y);

    y += 118;
    ctx.fillStyle = ORANGE;
    ctx.font = '800 100px ' + SANS;
    ctx.fillText(r.animal.name + ' · ' + r.base.name, CW / 2, y);

    y += 62;
    ctx.fillStyle = INK3;
    ctx.font = '34px ' + SANS;
    ctx.fillText(r.animal.role + ' · ' + r.animal.tag, CW / 2, y);

    // ---- 组合卡 ----
    var ct = y + 52;
    ctx.font = '800 46px ' + SANS;
    var tl = wrapText(ctx, r.combo.title, TEXT_W);
    ctx.font = '36px ' + SANS;
    var bl = wrapText(ctx, r.combo.line, TEXT_W);
    var titleB = ct + 54 + 44;
    var bodyB = titleB + (tl.length - 1) * 66 + 44;
    var ch = bodyB + (bl.length - 1) * 60 + 44 - ct;
    cardBg(ctx, MARGIN, ct, CARD_W, ch, 34);

    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = '800 46px ' + SANS;
    tl.forEach(function (ln, i) { ctx.fillText(ln, CW / 2, titleB + i * 66); });

    ctx.textAlign = 'left';
    ctx.fillStyle = INK2;
    ctx.font = '36px ' + SANS;
    bl.forEach(function (ln, i) { ctx.fillText(ln, MARGIN + PAD, bodyB + i * 60); });

    y = ct + ch;

    // ---- 段落卡 ----
    var SECS = [
      { icon: '🐾', label: '你是这样的人', body: [r.animal.desc] },
      { icon: '✨', label: '核心优势', body: r.animal.strengths, bullets: true },
      { icon: '🌿', label: '可能会绊住你的', body: r.animal.blind, bullets: true, warn: true },
      { icon: '🌙', label: '撑不住的时候', body: [r.animal.stress] },
      { icon: '💡', label: '给你的建议', body: [r.animal.advice] },
      { icon: '🌱', label: '你身上的另一只', body: [baseText] }
    ];

    SECS.forEach(function (s) {
      var top = y + GAP;
      var m = measureSec(ctx, s);
      cardBg(ctx, MARGIN, top, CARD_W, m.h, 34);

      // 小标题
      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.font = '800 40px ' + SANS;
      ctx.fillText(s.icon + '  ' + s.label, MARGIN + PAD, top + DIVIDER_Y - 26);

      // 分割线
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN + PAD, top + DIVIDER_Y);
      ctx.lineTo(MARGIN + CARD_W - PAD, top + DIVIDER_Y);
      ctx.stroke();

      // 正文
      var baseline = top + DIVIDER_Y + FIRST_LINE;
      m.items.forEach(function (ls, i) {
        if (i > 0) baseline += m.gap;
        ls.forEach(function (ln, j) {
          var by = baseline + j * m.lh;
          if (s.bullets && j === 0) {
            ctx.fillStyle = s.warn ? DOT_WARN : DOT;
            ctx.beginPath();
            ctx.arc(MARGIN + PAD + 8, by - 12, 6.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = INK2;
          ctx.font = '36px ' + SANS;
          ctx.fillText(ln, MARGIN + PAD + (s.bullets ? 34 : 0), by);
        });
        baseline += ls.length * m.lh;
      });

      y = top + m.h;
    });

    // ---- 放弃顺序 ----
    var seq = r.given.concat([r.taken]).filter(Boolean);
    var tt = y + GAP;
    var th = 226;
    cardBg(ctx, MARGIN, tt, CARD_W, th, 34);

    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = '800 40px ' + SANS;
    ctx.fillText('🧭  你放弃它们的顺序', MARGIN + PAD, tt + DIVIDER_Y - 26);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN + PAD, tt + DIVIDER_Y);
    ctx.lineTo(MARGIN + CARD_W - PAD, tt + DIVIDER_Y);
    ctx.stroke();

    var px = MARGIN + PAD;
    var py = tt + DIVIDER_Y + 58;
    ctx.font = '600 34px ' + SANS;
    ctx.textAlign = 'center';
    seq.forEach(function (name, i) {
      if (i) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#D8C8B6';
        ctx.fillText('→', px, py);
        px += ctx.measureText('→').width + 16;
        ctx.textAlign = 'center';
      }
      var w = ctx.measureText(name).width + 48;
      ctx.fillStyle = (i === seq.length - 1) ? ORANGE : '#F9F0E6';
      roundRect(ctx, px, py - 38, w, 58, 29);
      ctx.fill();
      ctx.fillStyle = (i === seq.length - 1) ? '#fff' : INK2;
      ctx.fillText(name, px + w / 2, py + 2);
      px += w + 14;
    });

    y = tt + th;

    // ---- 页脚 ----
    y += 86;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK3;
    ctx.font = '30px ' + SANS;
    ctx.fillText('— 没有标准答案，也没有更好的动物 —', CW / 2, y);

    y += 50;
    ctx.fillStyle = '#C6B6A6';
    ctx.font = '27px ' + SANS;
    ctx.fillText('20 种动物人格原型 · 自我探索参考', CW / 2, y);

    // ---- 裁剪 ----
    var realH = Math.min(c.height, y + 92);
    var out = document.createElement('canvas');
    out.width = CW;
    out.height = realH;
    out.getContext('2d').drawImage(c, 0, 0, CW, realH, 0, 0, CW, realH);

    cb(out);
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
    img.src = 'assets/animals/cute/' + r.animal.id + '.webp';

    function fail() {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存结果图';
      showToast('生成失败，请截图保存本页');
    }
  });
})();
