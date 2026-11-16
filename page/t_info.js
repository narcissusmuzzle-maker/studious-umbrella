// Проверка 1: что за часы и какие общие функции системы есть (устройство, пакет, разрешения, router, глобальные объекты).
import * as dev from '@zos/device'
import * as app from '@zos/app'
import * as router from '@zos/router'
import { startView } from '../shared/view'

const PERM = 'device:os.bg_service'

Page({
  build() {
    const v = startView('info', '1 Устройство')
    let sum = ''
    v.line('Устройство', () => {
      const d = dev.getDeviceInfo()
      sum = String(d.deviceName) + ' ' + d.width + 'x' + d.height
      return sum + ' src ' + d.deviceSource
    })
    v.line('Пакет', () => {
      const p = app.getPackageInfo()
      return 'appId ' + p.appId + ' v' + p.version
    })
    v.line('Разрешение службы', () => JSON.stringify(app.queryPermission({ permissions: [PERM] })))
    v.line('router', () => {
      const names = ['push', 'replace', 'back', 'home', 'exit', 'launchApp']
      const has = names.filter((n) => typeof router[n] === 'function')
      const no = names.filter((n) => typeof router[n] !== 'function')
      return 'есть ' + has.join(',') + (no.length ? ' НЕТ ' + no.join(',') : '')
    })
    v.line('app', () => {
      const names = ['getPackageInfo', 'queryPermission', 'requestPermission']
      return names.map((n) => n + (typeof app[n] === 'function' ? '+' : '-')).join(' ')
    })
    v.line('Старые глобальные', () => {
      return ['hmFS', 'hmApp', 'hmUI', 'hmSetting', 'hmBle'].map((n) => n + (typeof globalThis[n] !== 'undefined' ? '+' : '-')).join(' ')
    })
    v.line('Таймеры', () => 'setTimeout ' + typeof setTimeout + ', setInterval ' + typeof setInterval)
    v.done(sum || 'нет данных')
  },
  onDestroy() {}
})
