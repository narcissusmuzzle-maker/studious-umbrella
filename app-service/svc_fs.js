/**
 * Пробная служба 1 (svc_fs): раз в минуту пишет отчёт в файл svc_fs.json. По документации запись файлов из службы
 * разрешена только при погашенном экране — поэтому в отчёте есть «прошлая запись» (чем кончилась прошлая попытка).
 */
import { Time } from '@zos/sensor'
import { writeFileSync } from '@zos/fs'

let n = 0
let prev = 'ещё не писала'
let sensor = null

function tick() {
  n++
  const rep = { n: n, t: Date.now(), st: typeof setTimeout, si: typeof setInterval, prev: prev }
  try {
    writeFileSync({ path: 'svc_fs.json', data: JSON.stringify(rep), options: { encoding: 'utf8' } })
    prev = 'файл OK'
  } catch (e) { prev = 'файл ОШИБКА ' + String(e).slice(0, 40) }
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
