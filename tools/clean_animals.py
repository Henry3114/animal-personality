"""把木刻版画动物图处理成「纯墨色 + 透明底」的 RGBA，可叠在任意背景上"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = r"D:\ai\animal-personality\assets\animals"
OUT = os.path.join(SRC, "clean")
os.makedirs(OUT, exist_ok=True)

MAP = {
    "ox.png":     "Vintage_woodcut_engraving_illu_2026-11-03T07-03-10.png",
    "monkey.png": "Vintage_woodcut_engraving_illu_2026-11-03T07-03-23.png",
    "lion.png":   "Vintage_woodcut_engraving_illu_2026-11-03T07-03-35.png",
    "horse.png":  "Vintage_woodcut_engraving_illu_2026-11-03T07-03-46.png",
    "sheep.png":  "Vintage_woodcut_engraving_illu_2026-11-03T07-04-01.png",
}

INK = (22, 35, 47)
WHITE_PT = 205
BLACK_PT = 85


def to_alpha(v):
    """v: 归一化灰度(0-255) → 墨量 0-1"""
    a = (255.0 - v) / 255.0
    a = np.power(a, 0.75)                 # 抬一点中间调，线条更实
    a = np.where(a <= 0.06, 0.0, a)       # 压掉纸底残留
    return np.clip(a, 0.0, 1.0)


for out_name, src_name in MAP.items():
    p = os.path.join(SRC, src_name)
    im = Image.open(p).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, int(h * 0.90)))     # 去底部水印
    im = im.filter(ImageFilter.MedianFilter(3))

    g = im.convert("L")
    a = np.asarray(g, dtype=np.float32)

    # 局部纸白估计：大核最大值 + 模糊
    bg = g.filter(ImageFilter.MaxFilter(35)).filter(ImageFilter.GaussianBlur(18))
    bga = np.maximum(np.asarray(bg, dtype=np.float32), 1.0)

    norm = np.clip(a * 255.0 / bga, 0, 255)
    v = np.clip((norm - BLACK_PT) / (WHITE_PT - BLACK_PT) * 255.0, 0, 255)

    alpha = (to_alpha(v) * 255).astype(np.uint8)

    rgba = np.zeros((v.shape[0], v.shape[1], 4), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = INK
    rgba[..., 3] = alpha

    out = Image.fromarray(rgba, "RGBA")

    # 按 alpha 裁边
    bb = out.split()[3].point(lambda x: 255 if x > 12 else 0).getbbox()
    if bb:
        pad = 10
        out = out.crop((max(0, bb[0] - pad), max(0, bb[1] - pad),
                        min(out.width, bb[2] + pad), min(out.height, bb[3] + pad)))

    out.thumbnail((760, 760), Image.LANCZOS)
    out.save(os.path.join(OUT, out_name))

    # 统计覆盖率，确认不是一张全黑或全空的图
    cov = (np.asarray(out.split()[3]) > 30).mean()
    print(f"{out_name:12s} {out.size}  墨迹覆盖率 {cov*100:.1f}%")
