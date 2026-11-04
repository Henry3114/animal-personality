# 动物原型人格测试

六道题，一片走不出去的沙漠。你和五只动物一起走，每一轮都要放弃一只。

结果由「主导原型 × 底色原型」组合而成，共 20 种。

## 页面

| 文件 | 作用 |
|---|---|
| `index.html` | 封面 + 说明卡 + 卡密门禁 |
| `intro.html` | 开始之前的介绍页：理论来源、五只动物、免责说明 |
| `test.html` | 六道题，选项固定五只动物，已放弃的置灰 |
| `result.html` | 结果页 + Canvas 长图导出 |
| `data.js` | 5 只原型文案、20 组组合文案、6 道题、计分函数 |
| `style.css` | 全站样式（奶油底 #FDF7F0 / 白卡 / 陶土橙 #D9784A） |
| `test.js` / `result.js` | 答题与结果渲染 |

## 介绍页

`intro.html` 的版式和文案都照参考图来，不自行发挥：

- 品牌区：爪印圆标 / `Animal Personality` / 动物原型人格测试 / 「基于心理学研究的专业评估工具」
- 白卡「动物塑测试」+ 参考图原文一段（只把「60 道题」改成「6 道题」，本测试是 6 题，不改会当场穿帮）
- 五只 Q 版动物 + 三个标签「20 种原型 / 多维解析 / 专属结果卡」
- 「开始测试 →」进 `test.html`；底部一行免责

⚠️ 参考图原文有「基于多个经过验证的心理测量量表」，本测试没有做过信效度检验，
这句属于宣传口径。要收敛的话改 `intro.html` 里 `.about-p` 那一段即可。

矮屏（≤780px 高）另有一套压缩规则，保证 375×667 也能一屏放下按钮；
注意 `.disc-line` 设了 `order: 3`，否则会被封面那条 `.start-wrap { order: 1 }` 挤到按钮上面。

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

11 张成品图由 `cards.html` 渲染，不在仓库里（体积大），本地生成：

```bash
python tools/cards.py          # 全部
python tools/cards.py c3 c5    # 只出某几张
```

- `cards.html`：11 张卡片模板，`#c1`—`#c11` 用 hash 定位，1242×1660
- 卡片顺序：c1 封面 → c2—c6 六道题 → c7—c9 三个结果示例 → c10 理论依据 → c11 结尾
- `tools/cards.py`：Playwright 逐张截图，输出到 `out/`
- `assets/scenes/cute/`：Q 版沙漠插画（webp），一题一张
- 发布文案、标题、话题、评论引导见 `out/文案.md`

## 动物头像

网站和小红书卡片都用 Q 版：头像在 `assets/animals/cute/`，场景在
`assets/scenes/cute/`。早期那套木刻版画（`assets/animals/clean/`）和铅笔
场景（`assets/scenes/cards/`）已经不用了，留作备份。

```bash
python tools/cute_animals.py   # 头像：从 cute_src/ 原图去底、归一化、导 webp
python tools/cute_scenes.py    # 场景：裁水印、抹掉会被白卡切断的太阳、导 webp
```

脚本做三件事：从四边灌水去白底（不伤动物内部的奶油色）、按墨迹面积
归一化视觉体积、限制轮廓到圆心的最大距离，保证放进圆形头像不被裁。

跑完会额外生成 `assets/animals/cute-images.js`：5 张 400px 头像内联成
data URI（约 144KB），页面直接用它当 `src`，**不再有单独的图片请求**。
原因是国内访问 github.io 时经常个别图片请求失败，页面上就会出现几个
空白圆。改了头像要重跑脚本，这个文件会自动更新。

改文案直接改 `cards.html` 里的中文；换结果组合改 c7/c8/c9 的
`typeName` / `typeSub` / `punch` / `traits`，全文在 `data.js` 的 `COMBOS`。

## 截图

```bash
python -m http.server 8099      # 另开一个终端
python tools/shots.py
```

出一套 9 张，覆盖门禁 / 封面 / 介绍页 / 答题 / 已放弃 / 结果首屏 / 结果整页 /
导出长图 / 介绍页桌面版。文件名固定，重跑覆盖，`shots/` 里永远只有这一套。

## 部署

纯静态，推送到 GitHub 后开启 Pages（main 分支根目录）即可。
