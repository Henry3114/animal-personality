"""网站端到端测试：走完整测试流程并截图"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8811"
OUT = r"D:\ai\animal-personality\shots"
os.makedirs(OUT, exist_ok=True)

ok = True
def log(*a):
    print(*a, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        locale="zh-CN",
        accept_downloads=True,
    )
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append("PAGEERROR: " + str(e)))

    # 1. 门禁
    page.goto(BASE + "/index.html", wait_until="networkidle")
    page.wait_for_timeout(600)
    page.screenshot(path=OUT + r"\01_gate.png")

    # 2. 输错卡密
    page.fill("#gateInput", "wrong123")
    page.click("#gateBtn")
    page.wait_for_timeout(500)
    err_shown = page.eval_on_selector("#gateErr", "el => el.classList.contains('show')")
    log("错误卡密提示:", err_shown)
    if not err_shown: ok = False

    # 3. 正确卡密
    page.fill("#gateInput", "ap2026")
    page.click("#gateBtn")
    page.wait_for_timeout(700)
    hidden = page.eval_on_selector("#gate", "el => el.classList.contains('hide')")
    log("门禁已解锁:", hidden)
    if not hidden: ok = False
    page.screenshot(path=OUT + r"\02_cover.png")

    # 4. 开始测试
    page.click("#startBtn")
    page.wait_for_url("**/test.html", timeout=5000)
    page.wait_for_timeout(800)
    log("进入答题页:", page.url.endswith("test.html"))
    page.screenshot(path=OUT + r"\03_q1.png")

    # 逐题作答：第1轮放弃羊，第2轮放弃猴，第3轮放弃牛，带走马，递水马，舍不得马
    picks = ["羊", "猴", "牛", "马", "马", "马"]
    for i, name in enumerate(picks):
        q = page.text_content("#qText")
        stage = page.text_content("#stageLabel")
        log(f"  第{i+1}题 [{stage}] {q[:30]}…")
        # 置灰数量校验
        dead = page.eval_on_selector_all(".opt.dead", "els => els.length")
        log(f"    置灰数: {dead}")
        if i in (1,):
            page.screenshot(path=OUT + r"\04_q2_dead.png")
        if i == 3:
            page.screenshot(path=OUT + r"\05_q4_take.png")
        # 点对应名字的卡片
        page.click(f".opt:not(.dead) >> text={name}")
        page.wait_for_timeout(420)

    # 5. 结果页
    page.wait_for_url("**/result.html", timeout=6000)
    page.wait_for_timeout(1200)
    log("结果页:", page.url)
    name = page.text_content("#resName")
    title = page.text_content("#comboTitle")
    log("结果:", name, "|", title)
    page.screenshot(path=OUT + r"\06_result_top.png")
    page.screenshot(path=OUT + r"\07_result_full.png", full_page=True)

    # 6. 导出长图
    with page.expect_download(timeout=20000) as dl:
        page.click("#saveBtn")
    d = dl.value
    path = OUT + r"\08_tallcard.png"
    d.save_as(path)
    log("长图已保存:", path, os.path.getsize(path), "bytes")

    # 7. 再测一次
    page.click("#againBtn")
    page.wait_for_url("**/test.html", timeout=5000)
    log("再测一次 -> 回到答题页:", page.url.endswith("test.html"))

    # 8. 直接访问结果页（无数据）
    ctx2 = browser.new_context(viewport={"width": 390, "height": 844})
    p2 = ctx2.new_page()
    p2.goto(BASE + "/result.html")
    p2.wait_for_timeout(900)
    log("无数据访问结果页重定向到:", p2.url)
    if not p2.url.endswith("index.html"): ok = False

    # 9. 未过门禁访问测试页
    p2.goto(BASE + "/test.html")
    p2.wait_for_timeout(900)
    log("未解锁访问测试页重定向到:", p2.url)
    if not p2.url.endswith("index.html"): ok = False

    log("控制台错误:", errors if errors else "无")
    if errors: ok = False

    browser.close()

log("=== 结果:", "全部通过" if ok else "存在失败项")
sys.exit(0 if ok else 1)
