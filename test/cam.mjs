import puppeteer from 'puppeteer-core'
const [,, url, out, w='1000', h='563', js='', wait='2500'] = process.argv
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
await p.goto(url, { waitUntil: 'load' })
await p.waitForFunction(() => window.__eng && document.getElementById('loading').classList.contains('hidden'), { timeout: 30000 })
await new Promise(r => setTimeout(r, 1500))
if (js) await p.evaluate(js)
await new Promise(r => setTimeout(r, +wait))
await p.screenshot({ path: out }); await b.close()
