"""把 Q 版场景插画处理成卡片素材：裁掉右下角水印，放大到 1242 宽，导 webp"""
import os
import glob
import numpy as np
from PIL import Image, ImageFilter

SRC = r"D:\ai\animal-personality\assets\scenes\cute_src"
OUT = r"D:\ai\animal-personality\assets\scenes\cute"
os.makedirs(OUT, exist_ok=True)

# 生成时间顺序 → 文件名
MAP = {
    "footprints":  "Minimal_flat_vector_illustrati_2026-11-04T05-47-04.png",
    "dry_well":    "Minimal_flat_vector_illustrati_2026-11-04T05-47-44.png",
    "two_dune":    "Minimal_flat_vector_illustrati_2026-11-04T05-47-56.png",
    "water_empty": "Minimal_flat_vector_illustrati_2026-11-04T05-48-10.png",
    "look_back":   "Minimal_flat_vector_illustrati_2026-11-04T05-48-22.png",
    "five_walk":   "Minimal_flat_vector_illustrati_2026-11-04T05-48-48.png",
}

W = 1242          # 卡片宽度
TRIM = 0.075      # 底部裁掉的比例（水印）


def drop_sun(im):
    """把左上角那个太阳抹掉：白卡会把它切成半个圆，看着像瑕疵。
    用逐行中位数取天空色（再沿 y 平滑），避免出现条纹；掩膜先膨胀盖住抗锯齿边。"""
    a = np.asarray(im).astype(np.float32)
    y0, y1, x1max = 140, 780, 480

    sub = a[y0:y1, 0:x1max]
    m = (sub[..., 0] > 204) & (sub[..., 1] < 184) & (sub[..., 2] < 156)
    if m.sum() < 500:
        return im

    mask = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))
    m = np.asarray(mask) > 0

    # 逐行天空色（取太阳右侧干净区域的中位数），再平滑
    rows = np.arange(y0, y1)
    cols = np.full(len(rows), np.nan)
    for i, y in enumerate(rows):
        band = a[y, x1max + 20:x1max + 260]
        cols[i] = band.reshape(-1, 3).mean(axis=0) @ np.array([1, 0, 0]) if False else 0
    colors = np.stack([
        np.array([np.median(a[y, x1max + 20:x1max + 300, c]) for y in rows]) for c in range(3)
    ], axis=1)
    # 沿 y 做滑动平均
    k = 21
    pad = np.pad(colors, ((k // 2, k // 2), (0, 0)), mode="edge")
    colors = np.stack([np.convolve(pad[:, c], np.ones(k) / k, mode="valid") for c in range(3)], axis=1)

    for i, y in enumerate(rows):
        idx = np.nonzero(m[i])[0]
        if len(idx) == 0:
            continue
        xe = min(idx.max() + 2, x1max)
        c = colors[i]
        for x in range(0, xe):
            f = 0.975 + 0.025 * (x / max(xe, 1))
            a[y, x] = np.clip(c * f, 0, 255)

    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


for name, fn in MAP.items():
    im = Image.open(os.path.join(SRC, fn)).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, int(h * (1 - TRIM))))
    if name in ("footprints", "five_walk"):
        im = drop_sun(im)

    # 放大到卡片宽度
    nh = round(im.height * W / im.width)
    im = im.resize((W, nh), Image.LANCZOS)

    out = os.path.join(OUT, name + ".webp")
    im.save(out, "WEBP", quality=90, method=6)

    # 采样几处颜色，确认是奶油色系而不是偏灰
    a = np.asarray(im)
    top = a[:80].reshape(-1, 3).mean(axis=0).astype(int)
    print(f"{name:12s} {im.size}  顶部平均色 {tuple(top)}  "
          f"{os.path.getsize(out)//1024}KB")
