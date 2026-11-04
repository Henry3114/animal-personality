import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)

        # 1 封面 → 解锁
        await pg.goto("http://127.0.0.1:8099/index.html", wait_until="networkidle")
        await pg.fill("#gateInput", "ap2026")
        await pg.click("#gateBtn")
        await pg.wait_for_timeout(400)
        await pg.click("#startBtn")
        await pg.wait_for_url("**/intro.html")
        print("封面 →", pg.url.split("/")[-1])

        # 2 介绍页首屏
        await pg.wait_for_timeout(400)
        await pg.screenshot(path="shots/11_intro_first.png")
        await pg.screenshot(path="shots/12_intro_full.png", full_page=True)

        # 3 开始 6 题
        await pg.click("#goBtn")
        await pg.wait_for_url("**/test.html")
        await pg.wait_for_timeout(500)
        print("介绍 →", pg.url.split("/")[-1], "| 标题:", await pg.title())
        print("题号:", await pg.inner_text("#cur"), "| 首题:", (await pg.inner_text("#qText"))[:18])
        await pg.screenshot(path="shots/13_test_from_intro.png")

        # 4 五只头像是否都加载出来
        imgs = await pg.evaluate("""() => {
          const el = [...document.querySelectorAll('#coverAnimals img, .opt img')];
          return el.map(i => i.complete && i.naturalWidth > 0);
        }""")
        print("头像加载:", imgs)
        print("错误:", errs)
        await b.close()

asyncio.run(main())
