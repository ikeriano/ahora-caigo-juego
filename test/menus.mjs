import puppeteer from 'puppeteer-core'
const [,, base='http://127.0.0.1:4180/', W='844', H='390', prefix='previews/'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36')
await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1, isMobile: true, hasTouch: true, isLandscape: true })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
await p.goto(base + '?nosw', { waitUntil: 'load' })
await p.waitForFunction(() => document.querySelector('#menu .ttap'), { timeout: 30000 })
await sleep(2500); await p.screenshot({ path: prefix + '00-portada.png' })
await p.click('#menu .title'); await sleep(1200); await p.screenshot({ path: prefix + '01-menu.png' })
const clickText = async t => { await p.evaluate(t => [...document.querySelectorAll('#menu button')].find(b => b.textContent.includes(t)).click(), t); await sleep(900) }
await clickText('Jugar'); await p.screenshot({ path: prefix + '01b-jugar.png' })
await clickText('Volver'); await clickText('Opciones'); await p.screenshot({ path: prefix + '15-opciones.png' })
await clickText('Volver'); await clickText('Cómo se juega'); await p.screenshot({ path: prefix + '16-como-se-juega.png' })
await clickText('Volver'); await clickText('Créditos'); await p.screenshot({ path: prefix + '17-creditos.png' })
await clickText('Volver'); await clickText('Instalar'); await sleep(300); await p.screenshot({ path: prefix + '18-instalar.png' })
console.log('ok'); await b.close()
