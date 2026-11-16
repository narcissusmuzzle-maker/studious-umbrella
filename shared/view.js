/**
 * Общий вид страницы проверки: кнопка «← меню», заголовок, текст результатов. Все шаги идут через line(),
 * поэтому один упавший шаг не мешает остальным.
 */
import { createWidget, widget, prop, align } from '@zos/ui'
import * as router from '@zos/router'
import { saveOne } from './diag'

export const W = 432

export function short(e, n) {
  const s = String(e && e.message ? e.message : e)
  const m = n || 60
  return s.length > m ? s.slice(0, m) + '…' : s
}

export function goMenu() {
  try {
    if (typeof router.replace === 'function') { router.replace({ url: 'page/index' }); return }
  } catch (e) { /* дальше */ }
  try { router.back() } catch (e) { /* остаёмся */ }
}

export function addButton(x, y, w, h, text, fn, size) {
  return createWidget(widget.BUTTON, {
    x: x, y: y, w: w, h: h, radius: 10, text: text, text_size: size || 22,
    normal_color: 0x2a2a2a, press_color: 0x555555, color: 0xffffff, click_func: fn
  })
}

/** Создаёт экран. Возвращает { add(строка), set(массив строк), line(метка, fn), done(итог) }. */
export function startView(key, title, bodyH) {
  createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: 514, color: 0x000000 })
  const body = createWidget(widget.TEXT, {
    x: 16, y: 52, w: W - 32, h: bodyH || 440, color: 0xdddddd, text_size: 19,
    align_h: align.LEFT, align_v: align.TOP, text_style: 1, text: title + '…'
  })
  addButton(10, 6, 130, 38, '← меню', goMenu, 20)
  createWidget(widget.TEXT, {
    x: 150, y: 6, w: W - 160, h: 38, color: 0x43a857, text_size: 22,
    align_h: align.CENTER_H, align_v: align.CENTER_V, text: title
  })
  const lines = []
  const render = () => { try { body.setProperty(prop.TEXT, lines.join('\n')) } catch (e) { /* не страшно */ } }
  const stat = { ok: 0, err: 0 }
  return {
    stat,
    add(s) { lines.push(String(s)); render() },
    set(arr) { lines.length = 0; for (let i = 0; i < arr.length; i++) lines.push(String(arr[i])); render() },
    /** Выполнить шаг: результат fn() — текст после метки (или OK). Исключение — строка ОШИБКА, остальные шаги идут дальше. */
    line(label, fn) {
      try {
        const r = fn()
        stat.ok++
        lines.push(label + ': ' + (r === undefined || r === true ? 'OK' : r))
      } catch (e) {
        stat.err++
        lines.push(label + ': ОШИБКА ' + short(e))
      }
      render()
    },
    done(summary) {
      const status = stat.err === 0 ? 'OK' : (stat.ok === 0 ? 'ERR' : 'PART')
      saveOne(key, status + '|' + summary)
    }
  }
}
