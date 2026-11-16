/**
 * Luv Diag — меню проверок. Показывает итог каждой проверки (из файла журнала) и ведёт на страницу проверки.
 * Нажатие на пункт сначала помечает его «T»: если страница не загрузилась, в меню останется «не открылась».
 */
import { createWidget, widget, prop, align } from '@zos/ui'
import * as router from '@zos/router'
import { loadAll, saveOne } from '../shared/diag'

const W = 432
const TESTS = [
  ['info', 'page/t_info', '1 Устройство'],
  ['store', 'page/t_store', '2 Запись'],
  ['read', 'page/t_read', '3 Чтение'],
  ['fs', 'page/t_fs', '4 Файлы'],
  ['svc', 'page/t_svc', '5 Служба']
]

let sumText = null

function lineFor(t, all) {
  const s = all[t[0]]
  let res
  if (s === undefined) res = 'не запускали'
  else if (s === 'T') res = 'НЕ ОТКРЫЛАСЬ (пусто)'
  else if (s.indexOf('T2|') === 0) res = 'отчётов службы нет — ' + s.slice(3)
  else {
    const i = s.indexOf('|')
    const code = s.slice(0, i)
    const txt = s.slice(i + 1)
    res = (code === 'OK' ? 'OK' : (code === 'PART' ? 'ЧАСТИЧНО' : 'ОШИБКА')) + ' — ' + txt
  }
  const full = t[2] + ': ' + res
  return full.length > 70 ? full.slice(0, 70) + '…' : full
}

function refresh() {
  if (!sumText) return
  const all = loadAll()
  try { sumText.setProperty(prop.TEXT, TESTS.map((t) => lineFor(t, all)).join('\n')) } catch (e) { /* не страшно */ }
}

function open(t) {
  saveOne(t[0], 'T')
  try { router.push({ url: t[1] }) } catch (e) {
    try { sumText.setProperty(prop.TEXT, 'Не открылось: ' + e) } catch (e2) { /* ничего */ }
  }
}

Page({
  build() {
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: 514, color: 0x000000 })
    sumText = createWidget(widget.TEXT, {
      x: 14, y: 8, w: W - 28, h: 250, color: 0xdddddd, text_size: 19,
      align_h: align.LEFT, align_v: align.TOP, text_style: 1, text: 'Luv Diag…'
    })
    for (let i = 0; i < TESTS.length; i++) {
      const t = TESTS[i]
      createWidget(widget.BUTTON, {
        x: 30, y: 262 + i * 50, w: W - 60, h: 44, radius: 10, text: t[2], text_size: 22,
        normal_color: 0x2a2a2a, press_color: 0x555555, color: 0xffffff, click_func: () => open(t)
      })
    }
    refresh()
  },
  onShow() { refresh() },
  onDestroy() { sumText = null }
})
