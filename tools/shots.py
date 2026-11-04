"""出一套当前版本的网站截图，覆盖：门禁 / 封面 / 介绍页 / 答题 / 已放弃 / 结果 / 桌面。
命名固定，重跑会覆盖，目录里永远只有这一套。
"""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8099/"
OUT = "shots/"
V = {"width": 390, "height": 844}


async def mobile(b):
    ctx = await b.new_context(viewport=V, device_scale_factor=2, accept_downloads=True)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # 01 门禁
    await pg.goto(BASE + "index.html", wait_until="networkidle")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT + "01_门禁.png")

    # 02 封面
    await pg.fill("#gateInput", "ap2026")
    await pg.click("#gateBtn")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT + "02_封面.png")

    # 03 介绍页
    await pg.click("#startBtn")
    await pg.wait_for_url("**/intro.html")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT + "03_介绍页.png")

    # 04 答题：第 1 题
    await pg.click("#goBtn")
    await pg.wait_for_url("**/test.html")
    await pg.wait_for_timeout(600)
    await pg.screenshot(path=OUT + "04_答题_第1题.png")

    # 05 答题：放弃一只之后（第 1 题的动物变灰）
    await pg.locator(".opt:not(.dead)").first.click()
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT + "05_答题_已放弃.png")

    # 06 / 07 结果页
    for _ in range(5):
        usable = pg.locator(".opt:not(.dead)")
        if await usable.count() == 0:
            break
        await usable.first.click()
        await pg.wait_for_timeout(320)
    await pg.wait_for_url("**/result.html", timeout=10000)
    await pg.wait_for_timeout(900)
    await pg.screenshot(path=OUT + "06_结果_首屏.png")
    await pg.screenshot(path=OUT + "07_结果_整页.png", full_page=True)

    # 08 导出的结果长图（点「保存结果图」直接落盘）
    async with pg.expect_download(timeout=20000) as dl:
        await pg.click("#saveBtn")
    await (await dl.value).save_as(OUT + "08_结果_导出长图.png")

    print("移动端 7 张完成，错误:", errs[:3])
    await ctx.close()


async def desktop(b):
    ctx = await b.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
    pg = await ctx.new_page()
    await pg.goto(BASE + "intro.html", wait_until="networkidle")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT + "09_介绍页_桌面.png")
    print("桌面端 1 张完成")
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        await mobile(b)
        await desktop(b)
        await b.close()


asyncio.run(main())
