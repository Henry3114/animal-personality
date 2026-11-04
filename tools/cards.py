"""把 cards.html 里的每张卡片渲染成 1242x1660 PNG，输出到 out/"""
import os, sys
from playwright.sync_api import sync_playwright

ROOT = r"D:\ai\animal-personality"
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)

# 卡片 id → 输出文件名（顺序即发布顺序）
PLAN = [
    ("c1",  "01_封面_你会放弃谁"),
    ("c2",  "02_再放弃一只"),
    ("c3",  "03_绿洲干涸"),
    ("c4",  "04_只能带一只走"),
    ("c5",  "05_最想先递给谁"),
    ("c6",  "06_最舍不得谁"),
    ("c7",  "07_结果_狮马"),
    ("c8",  "08_结果_牛羊"),
    ("c9",  "09_结果_羊猴"),
    ("c10", "10_依据_不是随口编的"),
    ("c11", "11_结尾_20种"),
]

SWITCH = """id => {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}"""

def main():
    only = [a for a in sys.argv[1:] if a]
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True)
        pg = b.new_page(viewport={"width": 1242, "height": 1660}, device_scale_factor=1)
        pg.goto(f"file:///{ROOT}/cards.html", wait_until="networkidle")
        pg.wait_for_timeout(600)
        for cid, name in PLAN:
            if only and cid not in only:
                continue
            pg.evaluate(SWITCH, cid)
            pg.wait_for_timeout(280)
            path = os.path.join(OUT, name + ".png")
            pg.screenshot(path=path, clip={"x": 0, "y": 0, "width": 1242, "height": 1660})
            print(f"{cid:4} -> {name}.png  {os.path.getsize(path)//1024} KB")
        b.close()

if __name__ == "__main__":
    main()
