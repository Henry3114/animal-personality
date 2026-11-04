"""把 AI 生成的 Q 版动物图去白底，统一视觉尺寸，输出透明 PNG + WebP。

- 背景用「从四边灌水」判定，避免误伤动物内部的奶油色区域
- alpha 轻微羽化后做去白边（unpremultiply），叠在米色底上不留白圈
- 每只缩放到同一内容高度，圆形头像里观感一致
"""
import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = r"D:\ai\animal-personality\assets\animals\cute_src"
OUT = r"D:\ai\animal-personality\assets\animals\cute"
os.makedirs(OUT, exist_ok=True)

MAP = {
    "ox":     "A_cute_chibi_cartoon_ox__kawai_2026-11-04T03-52-15.png",
    "monkey": "A_cute_chibi_cartoon_monkey__k_2026-11-04T03-52-25.png",
    "lion":   "A_cute_chibi_cartoon_baby_lion_2026-11-04T03-52-35.png",
    "horse":  "A_cute_chibi_cartoon_pony_foal_2026-11-04T03-56-47.png",
    "sheep":  "A_cute_chibi_cartoon_sheep__ka_2026-11-04T03-51-52.png",
}

CANVAS = 1024
TARGET_INK = 370000   # 归一化目标：每只动物的墨迹像素数一致，视觉体积才齐
BASE = 1.06           # 相对于 756px 内容高的整体缩放
LIMIT = 0.94          # 内容最长边不超过画布的这个比例
# 个别动物微调：猴子尾巴占高度，按面积算身体会偏小
PER = {"monkey": 1.14}
# 个别动物允许轻微出血（角落是尾巴尖/蹄子，裁掉不影响识别）
BLEED = {"horse": 1.13}


def cut_bg(im):
    """白底 → 透明。返回 RGBA。"""
    rgb = im.convert("RGB")
    a = np.asarray(rgb).astype(np.int16)
    near_white = (a.min(axis=2) >= 246)

    # 灌水：把与四边连通的近白区域标成背景
    # 注意：fromarray 出来的 buffer 只读，floodfill 会静默失败，必须 copy
    patch = Image.fromarray((near_white * 255).astype(np.uint8), "L").copy()
    w, h = patch.size
    seeds = []
    for x in range(0, w, 4):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, 4):
        seeds += [(0, y), (w - 1, y)]
    for p in seeds:
        if patch.getpixel(p) == 255:
            ImageDraw.floodfill(patch, p, 128, thresh=26)

    bg = (np.asarray(patch) == 128)

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.9))
    alpha = np.asarray(alpha_img).astype(np.float32) / 255.0

    # 去白边：反预乘
    af = alpha[..., None]
    src = np.asarray(rgb).astype(np.float32)
    with np.errstate(divide="ignore", invalid="ignore"):
        out = (src - (1.0 - af) * 255.0) / np.maximum(af, 1e-3)
    out = np.clip(out, 0, 255)

    rgba = np.dstack([out, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def normalize(im, extra=1.0, bleed=1.0):
    """按墨迹面积归一化，再居中放进正方形画布。
    高度归一化会让猴子（尾巴占高）显得小，面积归一化更接近肉眼体积。"""
    bb = im.split()[3].getbbox()
    im = im.crop(bb)

    ink = (np.asarray(im.split()[3]) > 40).sum()
    # 先把 ink 换算到「内容高 756」的基准，再按面积开方求缩放，避免二次缩放掉画质
    ink_base = ink * (756.0 / im.height) ** 2
    scale = (756.0 / im.height) * (TARGET_INK / max(ink_base, 1)) ** 0.5 * BASE * extra

    nw, nh = im.width * scale, im.height * scale
    k = min(1.0, CANVAS * LIMIT / max(nw, nh))
    nw, nh = max(1, round(nw * k)), max(1, round(nh * k))

    im = im.resize((nw, nh), Image.LANCZOS)

    # 圆形头像会裁掉四角：保证轮廓离圆心的最远距离不超过 95% 半径
    a = np.asarray(im.split()[3]) > 40
    ys, xs = np.nonzero(a)
    rmax = np.sqrt((xs - (nw - 1) / 2.0) ** 2 + (ys - (nh - 1) / 2.0) ** 2).max()
    limit_r = CANVAS * 0.5 * bleed
    if rmax > limit_r:
        k2 = limit_r / rmax
        nw, nh = max(1, round(nw * k2)), max(1, round(nh * k2))
        im = im.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(im, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), im)
    return canvas


for name, fn in MAP.items():
    p = os.path.join(SRC, fn)
    im = Image.open(p).convert("RGB")

    # 生成图底部可能有水印/杂点，裁掉最下 4%
    im = im.crop((0, 0, im.width, int(im.height * 0.96)))

    rgba = normalize(cut_bg(im), PER.get(name, 1.0), BLEED.get(name, 1.0))
    rgba.save(os.path.join(OUT, name + ".png"))

    # 站内最大显示：结果页大圆 112px（@3x=336）、长图 208px。
    # 400px 足够，且便于整体内联进 JS，避免国内访问 github.io 时图片请求丢失
    small = rgba.copy()
    small.thumbnail((400, 400), Image.LANCZOS)
    small.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=88, method=6)

    cov = (np.asarray(rgba.split()[3]) > 40).mean()
    print(f"{name:7s} {rgba.size} 覆盖率 {cov*100:4.1f}%  "
          f"png {os.path.getsize(os.path.join(OUT, name + '.png'))//1024}KB  "
          f"webp {os.path.getsize(os.path.join(OUT, name + '.webp'))//1024}KB")


# 生成内联图：5 张头像合成一个 JS，页面零图片请求
import base64, json

inline = {}
for name in MAP:
    with open(os.path.join(OUT, name + ".webp"), "rb") as f:
        inline[name] = "data:image/webp;base64," + base64.b64encode(f.read()).decode()

js = ("/* 自动生成，勿手改：python tools/cute_animals.py\n"
      "   头像内联为 data URI，避免网络不好时个别图片加载失败 */\n"
      "window.ANIMAL_IMG = " + json.dumps(inline, ensure_ascii=False) + ";\n")
with open(r"D://ai//animal-personality//assets//animals//cute-images.js", "w", encoding="utf-8") as f:
    f.write(js)

print("内联 JS", os.path.getsize(r"D://ai//animal-personality//assets//animals//cute-images.js") // 1024, "KB")
