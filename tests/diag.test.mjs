// Прогон меню, всех страниц проверок и пробных служб в Node на заглушках API часов.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'diag-'))
for (const d of ['page', 'shared', 'app-service']) fs.cpSync(path.join(root, d), path.join(tmp, d), { recursive: true })
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}')
for (const d of ['page', 'shared', 'app-service']) {
  for (const f of fs.readdirSync(path.join(tmp, d))) {
    const p = path.join(tmp, d, f)
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/from '(\.\.?\/(?:shared\/)?\w+)'/g, "from '$1.js'"))
  }
}
const mod = (name, code) => {
  const dir = path.join(tmp, 'node_modules', ...name.split('/'))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, type: 'module', main: 'index.js' }))
  fs.writeFileSync(path.join(dir, 'index.js'), code)
}
mod('@zos/ui', `
export const widget = { FILL_RECT: 'FILL_RECT', TEXT: 'TEXT', BUTTON: 'BUTTON' }
export const prop = { TEXT: 'text' }
export const align = { CENTER_H: 1, CENTER_V: 2, LEFT: 3, TOP: 4 }
export function createWidget(type, p) { const w = { type, p, setProperty(k, v) { w.p[k] = v } }; globalThis.__w.push(w); return w }`)
mod('@zos/router', `
export function push(o) { globalThis.__nav.push(['push', o.url]) }
export function replace(o) { globalThis.__nav.push(['replace', o.url]) }
export function back() { globalThis.__nav.push(['back']) }
export function home() {} export function exit() {} export function launchApp() {}`)
mod('@zos/fs', `
export function writeFileSync(o) { if (globalThis.__fsFail) throw new Error('fs off'); globalThis.__files.set(o.path, o.data) }
export function readFileSync(o) { return globalThis.__files.get(o.path) }`)
mod('@zos/device', `export function getDeviceInfo() { return { deviceName: 'Bip Max', width: 432, height: 514, deviceSource: 9999 } }`)
mod('@zos/app', `
export function getPackageInfo() { return { appId: 1072513, version: '0.1.0' } }
export function queryPermission() { return [0] }
export function requestPermission(o) { globalThis.__perm = o; return globalThis.__permResult }`)
mod('@zos/storage', `
export class ShareTypedStorage {
  constructor(s) { if (globalThis.__noStore) throw new Error('no typed'); this.s = s }
  putString(k, v) { globalThis.__m.set('t:' + k, v) } getString(k, d) { return globalThis.__m.has('t:' + k) ? globalThis.__m.get('t:' + k) : d }
  putInt(k, v) { globalThis.__m.set('ti:' + k, v) } getInt(k, d) { return globalThis.__m.has('ti:' + k) ? globalThis.__m.get('ti:' + k) : d }
  has(k) { return globalThis.__m.has('t:' + k) }
}
export class ShareLocalStorage {
  constructor(f) { if (globalThis.__noStore) throw new Error('no local'); this.f = f }
  setItem(k, v) { globalThis.__m.set('l:' + k, v) } getItem(k, d) { return globalThis.__m.has('l:' + k) ? globalThis.__m.get('l:' + k) : d }
}
export class LocalStorage { setItem(k, v) { globalThis.__m.set('o:' + k, v) } getItem(k) { return globalThis.__m.get('o:' + k) } }`)
mod('@zos/share-storage', `
export class TypedStorage {
  constructor(id, s) { this.id = id } getString(k, d) { const v = globalThis.__m.get(this.id === 1072513 ? 't:' + k : 'x:' + k); return v === undefined ? d : v }
}
export class LocalStorage {
  constructor(id, f) { this.id = id } isExisted() { return this.id === 1072513 }
  getItem(k, d) { const v = globalThis.__m.get('l:' + k); return v === undefined ? d : v }
}`)
mod('@zos/app-service', `
export function getAllAppServices() { return globalThis.__running }
export function start(o) { globalThis.__started.push(o.file); o.complete_func({ result: true }); return 0 }
export function stop(o) { globalThis.__stopped.push(o.file) }`)
mod('@zos/sensor', `export class Time { onPerMinute(cb) { globalThis.__minute = cb } offPerMinute() { globalThis.__minute = null } }`)

globalThis.__w = []; globalThis.__nav = []; globalThis.__files = new Map(); globalThis.__m = new Map()
globalThis.__running = []; globalThis.__started = []; globalThis.__stopped = []; globalThis.__permResult = 2
let page = null
globalThis.Page = (o) => { page = o }
let svc = null
globalThis.AppService = (o) => { svc = o }

const cache = new Map()
const load = async (f) => { if (!cache.has(f)) { page = null; await import(pathToFileURL(path.join(tmp, f)).href); cache.set(f, page) } return cache.get(f) }
const W = () => globalThis.__w
const bodyText = () => W().find((w) => w.type === 'TEXT' && String(w.p.text).length > 0 && w.p.y === 52 || (w.type === 'TEXT' && w.p.y === 8)).p.text
const btn = (t) => W().find((w) => w.type === 'BUTTON' && w.p.text === t)
const reset = () => { globalThis.__w = []; globalThis.__nav = [] }

// --- меню: ничего не запускали ---
let menu = await load('page/index.js')
menu.build()
assert.match(bodyText(), /1 Устройство: не запускали/)
assert.equal(W().filter((w) => w.type === 'BUTTON').length, 5)
// нажатие помечает «T» и ведёт на страницу; если страница ничего не запишет — «НЕ ОТКРЫЛАСЬ»
btn('2 Запись').p.click_func()
assert.deepEqual(globalThis.__nav.at(-1), ['push', 'page/t_store'])
menu.onShow()
assert.match(bodyText(), /2 Запись: НЕ ОТКРЫЛАСЬ/)

// --- проверки 1..4 ---
const runPage = async (file) => { reset(); const p = await load(file); p.build(); return bodyText() }
let t = await runPage('page/t_info.js')
assert.match(t, /Bip Max 432x514/); assert.match(t, /appId 1072513/); assert.match(t, /router: есть push,replace,back,home/)
t = await runPage('page/t_store.js')
assert.match(t, /typed: чтение обратно: совпало/); assert.match(t, /local: чтение обратно: совпало/)
assert.match(t, /ShareTypedStorage\+/)
t = await runPage('page/t_read.js')
assert.match(t, /Luv Diag \(своё\) typed ping: «\d+»/)
assert.match(t, /Luv Sync typed luv_c: пусто/)
assert.match(t, /Таймер local luv_c: файла нет/)
t = await runPage('page/t_fs.js')
assert.match(t, /Файл: запись и чтение: совпало/); assert.match(t, /SysProGetChars-/); assert.match(t, /hmFS \(глобальный\): нет/)

// меню показывает итоги
reset(); menu = await load('page/index.js'); menu.build()
const m1 = bodyText()
assert.match(m1, /1 Устройство: OK — Bip Max/)
assert.match(m1, /2 Запись: OK — typed OK, local OK/)
assert.match(m1, /3 Чтение: OK — своё: typed OK, local OK/)
assert.match(m1, /4 Файлы: OK/)

// ошибка одного шага не мешает остальным
globalThis.__noStore = true
t = await runPage('page/t_store.js')
assert.match(t, /typed: запись: ОШИБКА/); assert.match(t, /Своё хранилище приложения: работает/)
reset(); menu = await load('page/index.js'); menu.build()
assert.match(bodyText(), /2 Запись: ЧАСТИЧНО/)
globalThis.__noStore = false

// кнопка «← меню» возвращает через replace
await runPage('page/t_info.js')
btn('← меню').p.click_func()
assert.deepEqual(globalThis.__nav.at(-1), ['replace', 'page/index'])

// --- проверка 5: служба ---
reset(); let sp = await load('page/t_svc.js'); sp.build()
assert.match(bodyText(), /fs-служба \(файл\): отчёта нет/)
btn('Старт: файл').p.click_func()
assert.deepEqual(globalThis.__started, ['app-service/svc_fs'])
assert.match(bodyText(), /служба запущена/)
btn('Старт: общая').p.click_func()
assert.deepEqual(globalThis.__started, ['app-service/svc_fs', 'app-service/svc_share'])
btn('Стоп').p.click_func()
assert.deepEqual(globalThis.__stopped.sort(), ['app-service/svc_fs', 'app-service/svc_share'])

// --- сами службы ---
const svcCache = new Map()
const svcFile = async (f) => { if (!svcCache.has(f)) { svc = null; await import(pathToFileURL(path.join(tmp, f)).href); svcCache.set(f, svc) } return svcCache.get(f) }
let s1 = await svcFile('app-service/svc_fs.js')
s1.onInit()
assert.ok(JSON.parse(globalThis.__files.get('svc_fs.json')).n === 1)
globalThis.__minute()
const r2 = JSON.parse(globalThis.__files.get('svc_fs.json'))
assert.equal(r2.n, 2); assert.equal(r2.prev, 'файл OK')
globalThis.__fsFail = true
globalThis.__minute()   // запись упала — не падаем
globalThis.__fsFail = false
globalThis.__minute()
assert.match(JSON.parse(globalThis.__files.get('svc_fs.json')).prev, /ОШИБКА fs off|ОШИБКА Error: fs off/)
s1.onDestroy()
let s2 = await svcFile('app-service/svc_share.js')
s2.onInit()
assert.equal(JSON.parse(globalThis.__m.get('t:svc')).n, 1)
assert.equal(JSON.parse(globalThis.__m.get('l:svc')).n, 1)
globalThis.__minute()
assert.match(JSON.parse(globalThis.__m.get('t:svc')).prev, /typed OK, local OK/)
globalThis.__noStore = true
globalThis.__minute()   // не падает
globalThis.__noStore = false
s2.onDestroy()

// страница службы теперь видит отчёты
reset(); sp = await load('page/t_svc.js'); sp.build()
assert.match(bodyText(), /fs-служба \(файл\): тик \d+/)
assert.match(bodyText(), /share-служба \(typed\): тик \d+/)
// разрешение просят у пользователя (0) — запуск после ответа
globalThis.__started.length = 0; globalThis.__permResult = 0
btn('Старт: файл').p.click_func()
assert.equal(globalThis.__started.length, 0)
globalThis.__perm.callback([2])
assert.equal(globalThis.__started.length, 1)
console.log('diag: ok')
