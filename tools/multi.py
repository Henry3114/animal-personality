"""多组合抽查：不同作答是否得到不同结果，长图是否都能生成"""
import os
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8811"
OUT = r"D:\ai\animal-personality\shots\multi"
os.makedirs(OUT, exist_ok=True)

# 5 类典型作答：每次放弃顺序 + 带走 + 递水 + 舍不得
CASES = [
    ("舍己型", ["羊", "猴", "牛", "马", "马", "马"]),
    ("慕强型", ["羊", "牛", "猴", "狮", "狮", "狮"]),
    ("务实型", ["猴", "羊", "马", "牛", "羊", "牛"]),
    ("自由型", ["牛", "狮", "羊", "马", "马", "马"]),
    ("护短型", ["马", "狮", "牛", "羊", "羊", "羊"]),
]

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                        is_mobile=True, has_touch=True, accept_downloads=True)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    pg.goto(BASE + "/index.html", wait_until="networkidle")
    pg.fill("#gateInput", "ap2026"); pg.click("#gateBtn"); pg.wait_for_timeout(600)

    results = []
    for label, picks in CASES:
        pg.goto(BASE + "/test.html", wait_until="networkidle")
        pg.wait_for_timeout(400)
        for name in picks:
            pg.click(f".opt:not(.dead) >> text={name}")
            pg.wait_for_timeout(380)
        pg.wait_for_url("**/result.html", timeout=8000)
        pg.wait_for_timeout(800)
        name = pg.text_content("#resName")
        title = pg.text_content("#comboTitle")
        trail = pg.eval_on_selector("#trail", "el => el.innerText.replace(/\\n/g,'')")
        h = pg.evaluate("document.body.scrollHeight")
        results.append((label, name, title, trail, h))
        print(f"{label}: {name} | {title} | 顺序 {trail} | 页高 {h}")

        # 导出检查
        with pg.expect_download(timeout=20000) as dl:
            pg.click("#saveBtn")
        f = dl.value
        path = os.path.join(OUT, f"{label}_{name.replace(' · ','')}.png")
        f.save_as(path)
        sz = os.path.getsize(path)
        print(f"    长图 {sz//1024} KB")

    uniq = len(set(r[1] for r in results))
    print(f"\n不同结果数: {uniq} / {len(CASES)}")
    print("页面错误:", errs if errs else "无")
    b.close()
