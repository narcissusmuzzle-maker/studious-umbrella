// Проверка 5: фоновая служба. Две пробные службы: svc_fs (пишет файл) и svc_share (пишет в общую память).
// Каждая раз в минуту оставляет отчёт; страница показывает, как давно он обновлялся.
import * as svc from '@zos/app-service'
import * as app from '@zos/app'
import { readFileSync } from '@zos/fs'
import * as st from '@zos/storage'
import { startView, addButton, short } from '../shared/view'
import { SHARE_SCOPE, SHARE_FILE } from '../shared/const'
import { saveOne } from '../shared/diag'

const PERM = 'device:os.bg_service'
const FILES = { fs: 'app-service/svc_fs', share: 'app-service/svc_share' }
let msg = ''
let view = null
let busy = false

function ago(t) { return Math.max(0, Math.round((Date.now() - t) / 1000)) + ' с назад' }

function describe(name, r) {
  if (!r) return name + ': отчёта нет'
  return name + ': тик ' + r.n + ', ' + ago(r.t) + '; setTimeout ' + r.st + '; прошлая запись: ' + r.prev
}

function readFsReport() {
  try {
    const s = readFileSync({ path: 'svc_fs.json', options: { encoding: 'utf8' } })
    return s ? JSON.parse(s) : null
  } catch (e) { return null }
}
function readShareReports() {
  const out = {}
  try { const s = new st.ShareTypedStorage(SHARE_SCOPE).getString('svc', ''); out.typed = s ? JSON.parse(s) : null } catch (e) { out.typed = null }
  try { const s = String(new st.ShareLocalStorage(SHARE_FILE).getItem('svc', '')); out.local = s ? JSON.parse(s) : null } catch (e) { out.local = null }
  return out
}

function render() {
  if (!view) return
  const lines = []
  try { lines.push('Разрешение: ' + JSON.stringify(app.queryPermission({ permissions: [PERM] }))) } catch (e) { lines.push('Разрешение: ОШИБКА ' + short(e)) }
  try { lines.push('Работают: ' + JSON.stringify(svc.getAllAppServices())) } catch (e) { lines.push('Работают: ОШИБКА ' + short(e)) }
  const f = readFsReport()
  const sr = readShareReports()
  lines.push(describe('fs-служба (файл)', f))
  lines.push(describe('share-служба (typed)', sr.typed))
  lines.push(describe('share-служба (local)', sr.local))
  if (msg) lines.push('→ ' + msg)
  lines.push('')
  lines.push('Запустите службу, ПОГАСИТЕ экран на 2 минуты, снова откройте эту проверку и нажмите «Обновить».')
  view.set(lines)
  const parts = []
  parts.push('fs ' + (f ? 'тик ' + f.n : '—'))
  parts.push('typed ' + (sr.typed ? 'тик ' + sr.typed.n : '—'))
  parts.push('local ' + (sr.local ? 'тик ' + sr.local.n : '—'))
  saveOne('svc', ((f || sr.typed || sr.local) ? 'OK' : 'T2') + '|' + parts.join(', '))
}

function say(m) { msg = m; render() }

function doStart(which) {
  if (busy) return
  busy = true
  try {
    const code = svc.start({
      file: FILES[which],
      param: '',
      complete_func: (info) => { busy = false; say(which + ': ' + (info && info.result ? 'служба запущена' : 'не запустилась')) }
    })
    if (code !== 0 && code !== undefined) { busy = false; say(which + ': код запуска ' + code + (code === 2 ? ' (уже работает?)' : '')) }
  } catch (e) { busy = false; say(which + ': запуск ОШИБКА ' + short(e)) }
}

function startService(which) {
  let r
  try {
    r = app.requestPermission({ permissions: [PERM], callback: (res) => { say('разрешение: ответ ' + JSON.stringify(res)); doStart(which) } })
  } catch (e) { say('запрос разрешения ОШИБКА ' + short(e)); doStart(which); return }
  if (r === 2) doStart(which)
  else if (r === 1) { say('разрешение запросить нельзя (1)'); doStart(which) }
  else say('часы просят разрешение — ответьте на экране часов')
}

function stopAll() {
  const keys = Object.keys(FILES)
  for (let i = 0; i < keys.length; i++) {
    try { svc.stop({ file: FILES[keys[i]], complete_func: () => {} }) } catch (e) { /* дальше */ }
  }
  say('остановка отправлена')
}

Page({
  build() {
    view = startView('svc', '5 Служба', 340)
    addButton(16, 400, 190, 50, 'Старт: файл', () => startService('fs'), 20)
    addButton(226, 400, 190, 50, 'Старт: общая', () => startService('share'), 20)
    addButton(16, 458, 190, 50, 'Стоп', stopAll, 20)
    addButton(226, 458, 190, 50, 'Обновить', render, 20)
    render()
  },
  onDestroy() { view = null }
})
