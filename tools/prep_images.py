import os, shutil
from PIL import Image

SRC = r"D:\ai\animal-personality\assets\scenes"
CLEAN = os.path.join(SRC, "clean")
os.makedirs(CLEAN, exist_ok=True)

MAP = {
    "five_walk.png":     "Hand_drawn_pencil_sketch_illus_2026-11-03T06-56-59.png",
    "water_empty.png":   "Hand_drawn_pencil_sketch_illus_2026-11-03T06-58-40.png",
    "look_back.png":     "Hand_drawn_pencil_sketch_illus_2026-11-03T06-59-40.png",
    "dry_well.png":      "Hand_drawn_pencil_sketch_illus_2026-11-03T06-57-28.png",
    "two_dune.png":      "Hand_drawn_pencil_sketch_illus_2026-11-03T06-57-43.png",
    "lion_horse.png":    "Hand_drawn_pencil_sketch_illus_2026-11-03T06-59-07.png",
    "ox_sheep.png":      "Hand_drawn_pencil_sketch_illus_2026-11-03T06-59-54.png",
    "sheep_monkey.png":  "Hand_drawn_pencil_sketch_illus_2026-11-03T07-00-08.png",
    "footprints.png":    "Hand_drawn_pencil_sketch_illus_2026-11-03T07-00-23.png",
}

CUT_BOTTOM = 0.065
for out, src in MAP.items():
    p = os.path.join(SRC, src)
    if not os.path.exists(p):
        print("MISSING", src); continue
    im = Image.open(p).convert("RGB")
    w, h = im.size
    im2 = im.crop((0, 0, w, int(h * (1 - CUT_BOTTOM))))
    im2 = im2.resize((1242, int(1242 * im2.size[1] / im2.size[0])), Image.LANCZOS)
    im2.save(os.path.join(CLEAN, out), quality=95)
    print(out, im2.size)
