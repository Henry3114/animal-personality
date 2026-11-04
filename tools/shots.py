"""只截关键页面，便于视觉核对"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8811"
OUT = r"D:\ai\animal-personality\shots"

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                        is_mobile=True, has_touch=True, accept_downloads=True)
    pg = ctx.new_page()
    logs = []
    pg.on("console", lambda m: logs.append(m.type + ":" + m.text) if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: logs.append("PAGEERROR:" + str(e)))

    pg.goto(BASE + "/index.html", wait_until="networkidle")
    pg.screenshot(path=OUT + r"\01_gate.png")
    pg.fill("#gateInput", "ap2026"); pg.click("#gateBtn")
    pg.wait_for_timeout(900)
    pg.screenshot(path=OUT + r"\02_cover.png")

    pg.click("#startBtn"); pg.wait_for_url("**/test.html")
    pg.wait_for_timeout(700)
    pg.screenshot(path=OUT + r"\03_q1.png")

    for i, name in enumerate(["羊", "猴", "牛", "马", "马", "马"]):
        pg.click(f".opt:not(.dead) >> text={name}")
        pg.wait_for_timeout(430)
        if i == 0:
            pg.screenshot(path=OUT + r"\04_q2_dead.png")
        if i == 2:
            pg.screenshot(path=OUT + r"\05_q4_take.png")

    pg.wait_for_url("**/result.html", timeout=8000)
    pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT + r"\06_result_top.png")
    pg.screenshot(path=OUT + r"\07_result_full.png", full_page=True)

    with pg.expect_download(timeout=20000) as dl:
        pg.click("#saveBtn")
    dl.value.save_as(OUT + r"\08_tallcard.png")

    # 小屏 360x640 兜底检查
    ctx2 = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2,
                         is_mobile=True, has_touch=True)
    p2 = ctx2.new_page()
    p2.goto(BASE + "/index.html", wait_until="networkidle")
    p2.fill("#gateInput", "ap2026"); p2.click("#gateBtn"); p2.wait_for_timeout(800)
    p2.screenshot(path=OUT + r"\09_cover_small.png")
    p2.click("#startBtn"); p2.wait_for_url("**/test.html"); p2.wait_for_timeout(700)
    p2.screenshot(path=OUT + r"\10_q1_small.png")

    print("console:", logs if logs else "clean")
    b.close()
