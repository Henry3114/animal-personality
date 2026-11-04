# 动物原型人格测试

六道题，一片走不出去的沙漠。你和五只动物一起走，每一轮都要放弃一只。

结果由「主导原型 × 底色原型」组合而成，共 20 种。

## 页面

| 文件 | 作用 |
|---|---|
| `index.html` | 封面 + 卡密门禁 |
| `test.html` | 六道题，选项固定五只动物，已放弃的置灰 |
| `result.html` | 结果页 + Canvas 长图导出 |
| `data.js` | 5 只原型文案、20 组组合文案、6 道题、计分函数 |
| `style.css` | 全站样式 |
| `test.js` / `result.js` | 答题与结果渲染 |

## 计分

- 第 1/2/3 轮放弃：1 / 2 / 3 分
- 剩下的两只：被留下 4 分，被带走 5 分
- 第 5、6 题各 +1 分
- 最高分为主导，次高为底色 → 20 种组合
- 最高分并列时，优先取第 6 题「最舍不得」的那只

3000 条作答路径已穷举验证：20 种组合全部可达，无死路、无异常。

## 配置

卡密与开关在 `index.html` 底部脚本里：

```js
var GATE_ON  = true;      // 改成 false 即完全免费开放
var PASSCODE = 'ap2026';  // 卡密，大小写不敏感
```

## 小红书图文

10 张成品图由 `cards.html` 渲染，不在仓库里（体积大），本地生成：

```bash
python tools/cards.py          # 全部
python tools/cards.py c3 c5    # 只出某几张
```

- `cards.html`：10 张卡片模板，`#c1`—`#c10` 用 hash 定位，1242×1660
- `tools/cards.py`：Playwright 逐张截图，输出到 `out/`
- `assets/scenes/cards/`：铅笔场景图（webp），一题一张
- 发布文案、标题、话题、评论引导见 `out/文案.md`

改文案直接改 `cards.html` 里的中文；换结果组合改 c7/c8/c9 的
`typeName` / `typeSub` / `punch` / `traits`，全文在 `data.js` 的 `COMBOS`。

## 部署

纯静态，推送到 GitHub 后开启 Pages（main 分支根目录）即可。
