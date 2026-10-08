import puppeteer from 'puppeteer-core'
const [,, url, out, w='844', h='390', wait='2500'] = process.argv
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
p.on('console', m => { if (m.type()==='error'||m.type()==='warning') console.log('CONSOLE', m.text()) })
await p.goto(url, { waitUntil: 'load' })
await new Promise(r => setTimeout(r, +wait))
console.log('fps', await p.evaluate(() => window.__eng?.fps))
await p.screenshot({ path: out })
await b.close()
