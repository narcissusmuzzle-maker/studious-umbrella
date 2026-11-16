/**
 * Пробная служба 2 (svc_share): раз в минуту пишет отчёт в общую память (typed и local, ключ svc).
 * В отчёте — «прошлая запись»: чем кончилась прошлая попытка в каждый из каналов.
 */
import { Time } from '@zos/sensor'
import * as st from '@zos/storage'
import { SHARE_SCOPE, SHARE_FILE } from '../shared/const'

let n = 0
let prev = 'ещё не писала'
let sensor = null

function tick() {
  n++
  const json = JSON.stringify({ n: n, t: Date.now(), st: typeof setTimeout, si: typeof setInterval, prev: prev })
  let a = ''
  let b = ''
  try { new st.ShareTypedStorage(SHARE_SCOPE).putString('svc', json); a = 'typed OK' } catch (e) { a = 'typed ОШИБКА ' + String(e).slice(0, 30) }
  try { new st.ShareLocalStorage(SHARE_FILE).setItem('svc', json); b = 'local OK' } catch (e) { b = 'local ОШИБКА ' + String(e).slice(0, 30) }
  prev = a + ', ' + b
}

AppService({
  state: {},
  onInit() {
    tick()
    try {
      sensor = new Time()
      sensor.onPerMinute(tick)
    } catch (e) { prev = 'датчик времени ОШИБКА ' + String(e).slice(0, 40) }
  },
  onDestroy() {
    try { if (sensor && typeof sensor.offPerMinute === 'function') sensor.offPerMinute(tick) } catch (e) { /* ничего */ }
  }
})
